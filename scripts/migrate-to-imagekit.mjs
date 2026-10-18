// =============================================================================
//  Migración de Imágenes: Cloudinary -> ImageKit y Actualización en Postgres
// =============================================================================
//
// Modos de uso:
//   1. Prueba con 1 producto (dry-run, no toca la base de datos):
//      node --env-file=.env scripts/migrate-to-imagekit.mjs --dry-run --limit=1
//
//   2. Migrar solo las 3 categorías seleccionadas primero:
//      node --env-file=.env scripts/migrate-to-imagekit.mjs --categories=pulseras,tobilleras,rosarios
//
//   3. Migrar TODO el catálogo completo:
//      node --env-file=.env scripts/migrate-to-imagekit.mjs --all
//
// Características:
//   - Idempotente: si una imagen ya es de ImageKit (ik.imagekit.io), la salta.
//   - Pre-recorte inteligente: para fotos de catálogo del proveedor, descarga
//     de Cloudinary la versión limpia (c_crop,g_north,h_0.75/e_trim/c_pad,ar_1:1,b_white)
//     para que en ImageKit quede la joya 100% limpia, cuadrada y con fondo blanco.
//   - Reporte final en scripts/migration-report.json.
// =============================================================================

import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// --- Validar variables de entorno ---
const {
  IMAGEKIT_URL_ENDPOINT,
  IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY,
  DIRECT_URL,
  DATABASE_URL,
} = process.env;

if (!IMAGEKIT_URL_ENDPOINT || !IMAGEKIT_PRIVATE_KEY) {
  console.error("\n❌ Faltan credenciales de ImageKit en el archivo .env:");
  console.error("   Asegúrate de tener IMAGEKIT_URL_ENDPOINT y IMAGEKIT_PRIVATE_KEY\n");
  process.exit(1);
}

const connectionString = DIRECT_URL || DATABASE_URL;
if (!connectionString) {
  console.error("\n❌ Falta DIRECT_URL o DATABASE_URL en el archivo .env\n");
  process.exit(1);
}

// --- Argumentos de CLI ---
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isAll = args.includes("--all");

const catArg = args.find((a) => a.startsWith("--categories="))?.split("=")[1];
const targetCategories = catArg
  ? catArg.split(",").map((c) => c.trim().toLowerCase())
  : null;

const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;

// Normalizar endpoint de ImageKit (sin barra al final)
const IK_ENDPOINT = IMAGEKIT_URL_ENDPOINT.replace(/\/+$/, "");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// --- Subir imagen a ImageKit vía REST API con reintentos ---
async function uploadToImageKit({ fileUrl, fileName, folder }, retries = 3) {
  const authHeader = "Basic " + Buffer.from(IMAGEKIT_PRIVATE_KEY + ":").toString("base64");

  const formData = new FormData();
  formData.append("file", fileUrl);
  formData.append("fileName", fileName);
  formData.append("folder", folder);
  formData.append("useUniqueFileName", "false");
  formData.append("isPrivateFile", "false");

  try {
    const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 429 && retries > 0) {
        console.warn(`   ⏳ Rate limit alcanzado, esperando 3s para reintentar...`);
        await new Promise((r) => setTimeout(r, 3000));
        return uploadToImageKit({ fileUrl, fileName, folder }, retries - 1);
      }
      throw new Error(data.message || data.error || `HTTP ${res.status}`);
    }

    return data.url;
  } catch (err) {
    if (retries > 0 && (err.message.includes("fetch") || err.message.includes("ETIMEDOUT"))) {
      console.warn(`   ⏳ Reintentando por error de red: ${err.message}...`);
      await new Promise((r) => setTimeout(r, 2000));
      return uploadToImageKit({ fileUrl, fileName, folder }, retries - 1);
    }
    throw err;
  }
}

// Prepara la URL de Cloudinary para que baje limpia (sin precio y con fondo blanco)
function prepareSourceUrl(cldUrl) {
  if (!cldUrl.includes("res.cloudinary.com") || !cldUrl.includes("/upload/")) {
    return cldUrl;
  }
  // Si ya es foto de marca o tomada en local, no necesita recorte de catálogo
  if (cldUrl.includes("/treegold/marca/") || cldUrl.includes("/treegold/admin/")) {
    return cldUrl;
  }
  // Catálogo: aplicar recorte del precio y fondo blanco cuadrado 1:1
  const transforms = "c_crop,g_north,h_0.75/e_trim/c_pad,ar_1:1,b_white";
  return cldUrl.replace("/upload/", `/upload/${transforms}/`);
}

async function main() {
  console.log("=================================================");
  console.log("🚀 MIGRACIÓN TREEGOLD: CLOUDINARY -> IMAGEKIT");
  console.log("=================================================");
  console.log(`Endpoint ImageKit: ${IK_ENDPOINT}`);
  console.log(`Modo Dry-Run: ${isDryRun ? "SÍ (no modificará la BD)" : "NO (actualizará la BD)"}`);
  if (targetCategories) console.log(`Categorías filtradas: ${targetCategories.join(", ")}`);
  else if (isAll) console.log(`Modo: TODO EL CATÁLOGO`);
  else {
    console.log(`\n⚠️  No especificaste categorías ni --all.`);
    console.log(`   Uso: node --env-file=.env scripts/migrate-to-imagekit.mjs --categories=pulseras,tobilleras,rosarios`);
    console.log(`   O bien: node --env-file=.env scripts/migrate-to-imagekit.mjs --all\n`);
    process.exit(1);
  }
  console.log("-------------------------------------------------\n");

  console.log("📦 Consultando productos en Supabase...");
  const products = await prisma.product.findMany({
    where: targetCategories
      ? {
          category: {
            slug: { in: targetCategories },
          },
        }
      : {},
    include: {
      category: { select: { slug: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Encontrados ${products.length} productos coincidentes.\n`);

  const report = {
    fecha: new Date().toISOString(),
    dryRun: isDryRun,
    totalProcesados: 0,
    fotosSubidas: 0,
    fotosSaltadas: 0,
    errores: [],
  };

  const toProcess = products.slice(0, LIMIT);

  for (let i = 0; i < toProcess.length; i++) {
    const prod = toProcess[i];
    const catSlug = prod.category?.slug || "general";
    const prefix = `[${i + 1}/${toProcess.length}] ${prod.slug} (${prod.name})`;
    console.log(`\n💎 ${prefix}`);

    const currentImages = prod.images || [];
    const newImages = [];
    let changed = false;

    for (let imgIdx = 0; imgIdx < currentImages.length; imgIdx++) {
      const imgUrl = currentImages[imgIdx];

      // Si ya está en ImageKit, saltar
      if (imgUrl.includes("ik.imagekit.io")) {
        console.log(`   ⏩ Foto ${imgIdx + 1} ya está en ImageKit: ${imgUrl}`);
        newImages.push(imgUrl);
        report.fotosSaltadas++;
        continue;
      }

      // Nombre de archivo en ImageKit
      const fileExt = imgUrl.split(".").pop().split("?")[0] || "jpg";
      const fileName = currentImages.length > 1
        ? `${prod.slug}-${imgIdx + 1}.${fileExt}`
        : `${prod.slug}.${fileExt}`;
      const folder = `/treegold/${catSlug}`;

      const sourceCleanUrl = prepareSourceUrl(imgUrl);

      if (isDryRun) {
        console.log(`   🔍 [DRY-RUN] Subiría: ${sourceCleanUrl}`);
        console.log(`              A: ${IK_ENDPOINT}${folder}/${fileName}`);
        newImages.push(`${IK_ENDPOINT}${folder}/${fileName}`);
        changed = true;
        report.fotosSubidas++;
        continue;
      }

      try {
        console.log(`   ⬆️ Subiendo foto ${imgIdx + 1} a ImageKit (${folder}/${fileName})...`);
        const ikUrl = await uploadToImageKit({
          fileUrl: sourceCleanUrl,
          fileName,
          folder,
        });
        console.log(`   ✅ Listo: ${ikUrl}`);
        newImages.push(ikUrl);
        changed = true;
        report.fotosSubidas++;
        await new Promise((r) => setTimeout(r, 120));
      } catch (err) {
        console.error(`   ❌ Error subiendo foto ${imgIdx + 1}: ${err.message}`);
        newImages.push(imgUrl); // conservar la original en caso de fallo
        report.errores.push({
          product: prod.slug,
          image: imgUrl,
          error: err.message,
        });
      }
    }

    if (changed && !isDryRun) {
      await prisma.product.update({
        where: { id: prod.id },
        data: { images: newImages },
      });
      console.log(`   💾 Base de datos actualizada para ${prod.slug}`);
    }

    report.totalProcesados++;
  }

  writeFileSync("scripts/migration-report.json", JSON.stringify(report, null, 2));
  console.log("\n=================================================");
  console.log("🏁 PROCESO FINALIZADO");
  console.log(`   Productos procesados: ${report.totalProcesados}`);
  console.log(`   Fotos subidas:        ${report.fotosSubidas}`);
  console.log(`   Fotos ya en ImageKit: ${report.fotosSaltadas}`);
  console.log(`   Errores:              ${report.errores.length}`);
  console.log("   Reporte guardado en: scripts/migration-report.json");
  console.log("=================================================\n");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Fallo general:", e);
  await prisma.$disconnect();
  process.exit(1);
});

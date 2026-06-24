// =============================================================
//  Carga masiva de productos: Google Drive -> Cloudinary -> DB
// =============================================================
//
// Qué hace este script:
//   1. Recorre la carpeta local ./fotos/<categoria>/<imagen>.jpg
//   2. De cada nombre de archivo saca: código (SKU) y los dos precios
//   3. Sube la imagen a Cloudinary (sin perder calidad)
//   4. Crea/actualiza la categoría y el producto en la base de datos
//
// Es IDEMPOTENTE: puedes correrlo varias veces. Usa el código como
// identificador único, así que re-ejecutarlo actualiza en vez de duplicar.
//
// Cómo usarlo:
//   1. Descarga la carpeta de Google Drive y descomprímela dentro del
//      proyecto con el nombre "fotos" (debe quedar ./fotos/Anillos/...,
//      ./fotos/Aretes/..., etc.).
//   2. Completa en el archivo .env:
//        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
//        CLOUDINARY_API_KEY=...
//        CLOUDINARY_API_SECRET=...
//   3. Ejecuta:  node scripts/seed-productos.mjs
//
// =============================================================

import "dotenv/config";
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { IMG_EXT, slugify, parseFileName } from "./parse-utils.mjs";

// Prisma 7 usa un driver adapter. Conexión directa a Postgres (DIRECT_URL,
// puerto 5432) que es lo ideal para escrituras masivas como este seed.
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

// --- Configuración ---
const FOTOS_DIR = "./fotos";           // carpeta con las subcarpetas por categoría
const DEFAULT_STOCK = 0;                // stock inicial (ajústalo si quieres)
const LIMIT = process.env.SEED_LIMIT ? parseInt(process.env.SEED_LIMIT, 10) : Infinity; // prueba: SEED_LIMIT=3

// --- Verificación de credenciales de Cloudinary ---
const { NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("\n❌ Faltan credenciales de Cloudinary en el archivo .env:");
  console.error("   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET\n");
  process.exit(1);
}

cloudinary.config({
  cloud_name: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// --- Recolección de archivos ---

// Devuelve TODAS las imágenes bajo un directorio, entrando a subcarpetas.
function walkImages(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkImages(full));
    } else if (IMG_EXT.test(extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

function listImagesByCategory() {
  let categorias;
  try {
    categorias = readdirSync(FOTOS_DIR).filter((name) =>
      statSync(join(FOTOS_DIR, name)).isDirectory()
    );
  } catch {
    console.error(`\n❌ No encontré la carpeta "${FOTOS_DIR}".`);
    console.error("   Descarga la carpeta de Google Drive y descomprímela aquí como ./fotos\n");
    process.exit(1);
  }

  const items = [];
  for (const carpeta of categorias) {
    const catName = carpeta.trim();          // la categoría es la carpeta de primer nivel
    const catSlug = slugify(catName);
    // Recorre la categoría y todas sus subcarpetas (ej. "Rosarios/65 cm/").
    for (const fullPath of walkImages(join(FOTOS_DIR, carpeta))) {
      const archivo = fullPath.split(/[/\\]/).pop();
      const { code, prices } = parseFileName(archivo);
      items.push({ catName, catSlug, fullPath, archivo, code, prices });
    }
  }
  return items;
}

// --- Proceso principal ---

async function main() {
  console.log("📂 Leyendo imágenes...");
  const items = listImagesByCategory();

  if (items.length === 0) {
    console.error("❌ No se encontraron imágenes dentro de ./fotos");
    process.exit(1);
  }

  // Agrupar por código: un producto puede tener varias fotos.
  const porCodigo = new Map();
  const sinCodigo = [];
  for (const it of items) {
    if (!it.code) {
      sinCodigo.push(it.archivo);
      continue;
    }
    if (!porCodigo.has(it.code)) porCodigo.set(it.code, []);
    porCodigo.get(it.code).push(it);
  }

  console.log(`   ${items.length} imágenes · ${porCodigo.size} productos · ${sinCodigo.length} sin código\n`);

  const report = { creados: 0, fallidos: 0, sinCodigo, sospechosos: [], errores: [] };

  const total = Math.min(porCodigo.size, LIMIT);
  let i = 0;
  for (const [code, fotos] of porCodigo) {
    if (i >= LIMIT) break;
    i++;
    const { catName, catSlug, prices } = fotos[0];

    // Precios por POSICIÓN (según indicación del cliente):
    //   primer valor  = costo de la tienda   -> wholesalePrice
    //   segundo valor = precio público       -> retailPrice
    const wholesalePrice = prices.length > 1 ? prices[0] : null;
    const retailPrice = prices.length ? prices[prices.length - 1] : null;

    // Caso raro: público por debajo del costo (precios invertidos en el nombre).
    if (retailPrice !== null && wholesalePrice !== null && retailPrice < wholesalePrice) {
      report.sospechosos.push({ code, categoria: catName, costo: wholesalePrice, publico: retailPrice });
    }

    if (retailPrice === null) {
      console.warn(`⚠️  [${i}/${total}] ${code}: sin precio, se omite`);
      report.fallidos++;
      report.errores.push({ code, motivo: "sin precio" });
      continue;
    }

    try {
      // 1) Subir todas las fotos del producto a Cloudinary
      const urls = [];
      for (let j = 0; j < fotos.length; j++) {
        const { fullPath } = fotos[j];
        const publicId = fotos.length > 1 ? `${code}-${j + 1}` : `${code}`;
        const res = await cloudinary.uploader.upload(fullPath, {
          folder: `treegold/${catSlug}`,
          public_id: publicId,
          overwrite: true,
          resource_type: "image",
        });
        urls.push(res.secure_url);
      }

      // 2) Asegurar la categoría
      const category = await prisma.category.upsert({
        where: { slug: catSlug },
        update: {},
        create: { name: catName, slug: catSlug },
      });

      // 3) Crear/actualizar el producto
      await prisma.product.upsert({
        where: { slug: code },
        update: { retailPrice, wholesalePrice, images: urls, categoryId: category.id },
        create: {
          slug: code,
          name: `${catName} ${code}`,
          description: "",
          retailPrice,
          wholesalePrice,
          stock: DEFAULT_STOCK,
          images: urls,
          isRetail: true,
          categoryId: category.id,
        },
      });

      console.log(`✅ [${i}/${total}] ${catName} · ${code} · público $${retailPrice.toLocaleString("es-CO")}`);
      report.creados++;
    } catch (err) {
      console.error(`❌ [${i}/${total}] ${code}: ${err.message}`);
      report.fallidos++;
      report.errores.push({ code, motivo: err.message });
    }
  }

  writeFileSync("scripts/seed-report.json", JSON.stringify(report, null, 2));
  console.log(`\n🏁 Listo. ${report.creados} productos cargados, ${report.fallidos} con error.`);
  if (sinCodigo.length) console.log(`   ${sinCodigo.length} archivos sin código (revisa scripts/seed-report.json).`);
  if (report.sospechosos.length) console.log(`   ⚠️  ${report.sospechosos.length} con público < costo (revisa scripts/seed-report.json).`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

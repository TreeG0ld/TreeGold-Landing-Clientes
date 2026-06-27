// =============================================================
//  Aplica la corrección masiva de precios generada en
//  scripts/price-correction-data.json
// =============================================================
//
// Qué hace este script:
//   1. Lee scripts/price-correction-data.json
//   2. Para cada item con "cambia": true, actualiza en la DB:
//        - retailPrice    -> retailPriceNuevo
//        - wholesalePrice -> costoDrive
//      usando el código (slug) como identificador único del producto.
//   3. Imprime un resumen final (cuántos actualizados, cuántos
//      saltados, cuántos no encontrados, y la suma total de la
//      diferencia aplicada).
//
// Es IDEMPOTENTE: puedes correrlo varias veces, simplemente
// reescribe los mismos valores si ya se aplicaron antes.
//
// Cómo usarlo:
//   node scripts/apply-price-correction.mjs
//
// =============================================================

import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 usa un driver adapter. Conexión directa a Postgres (DIRECT_URL,
// puerto 5432), igual que en scripts/seed-productos.mjs.
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

const DATA_FILE = "./scripts/price-correction-data.json";

async function main() {
  const raw = readFileSync(DATA_FILE, "utf-8");
  const items = JSON.parse(raw);

  const toUpdate = items.filter((item) => item.cambia === true);

  console.log(`\nTotal de items en el archivo: ${items.length}`);
  console.log(`Items a actualizar (cambia=true): ${toUpdate.length}\n`);

  let updated = 0;
  let notFound = 0;
  let failed = 0;
  let totalDiff = 0;

  for (const item of toUpdate) {
    const { code, category, retailPriceNuevo, costoDrive, retailPriceActualDB } = item;

    try {
      const result = await prisma.product.update({
        where: { slug: code },
        data: {
          retailPrice: retailPriceNuevo,
          wholesalePrice: costoDrive,
        },
      });

      updated += 1;
      totalDiff += retailPriceNuevo - retailPriceActualDB;
      console.log(
        `✅ ${code} (${category}): retailPrice ${retailPriceActualDB} -> ${retailPriceNuevo}, wholesalePrice -> ${costoDrive}`
      );
    } catch (err) {
      // P2025 = registro no encontrado (slug no existe en la DB)
      if (err.code === "P2025") {
        notFound += 1;
        console.warn(`⚠️  ${code} (${category}): no existe un producto con ese slug, se omite.`);
      } else {
        failed += 1;
        console.error(`❌ ${code} (${category}): error al actualizar ->`, err.message);
      }
    }
  }

  console.log("\n========== RESUMEN ==========");
  console.log(`Actualizados correctamente: ${updated}`);
  console.log(`No encontrados (slug inexistente): ${notFound}`);
  console.log(`Fallidos por otro error: ${failed}`);
  console.log(`Suma total de la diferencia aplicada: $${totalDiff.toLocaleString("es-CO")}`);
  console.log("==============================\n");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error fatal:", err);
  await prisma.$disconnect();
  process.exit(1);
});

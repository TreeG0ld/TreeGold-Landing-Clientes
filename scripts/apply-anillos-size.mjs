// =============================================================
//  Aplica las tallas (campo `size`) de los anillos a la base de datos
// =============================================================
//
// Qué hace este script:
//   1. Lee scripts/anillos-tallas.json (lista de { slug, sizeValue })
//   2. Para cada item hace prisma.product.update({ where: { slug }, data: { size: sizeValue } })
//   3. Imprime un resumen final (actualizados, no encontrados, errores)
//
// Es IDEMPOTENTE: puedes correrlo varias veces sin problema.
//
// Cómo usarlo:
//   node scripts/apply-anillos-size.mjs
//
// =============================================================

import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

const DATA_PATH = new URL("./anillos-tallas.json", import.meta.url);

async function main() {
  const raw = readFileSync(DATA_PATH, "utf-8");
  const items = JSON.parse(raw);

  console.log(`Encontrados ${items.length} anillos en anillos-tallas.json\n`);

  let updated = 0;
  let notFound = 0;
  let errors = 0;
  const notFoundSlugs = [];
  const errorSlugs = [];

  for (const item of items) {
    const { slug, sizeValue } = item;
    if (!slug || !sizeValue) {
      console.warn(`⚠️  Item inválido (sin slug o sizeValue), se omite:`, item);
      continue;
    }

    try {
      const result = await prisma.product.updateMany({
        where: { slug },
        data: { size: sizeValue },
      });

      if (result.count > 0) {
        updated += result.count;
        console.log(`✅ ${slug} -> "${sizeValue}"`);
      } else {
        notFound++;
        notFoundSlugs.push(slug);
        console.warn(`⚠️  No se encontró producto con slug "${slug}"`);
      }
    } catch (err) {
      errors++;
      errorSlugs.push(slug);
      console.error(`❌ Error actualizando "${slug}":`, err.message);
    }
  }

  console.log("\n=============================================");
  console.log("Resumen final");
  console.log("=============================================");
  console.log(`Total en archivo:     ${items.length}`);
  console.log(`Actualizados:         ${updated}`);
  console.log(`No encontrados:       ${notFound}`);
  if (notFoundSlugs.length) console.log(`  -> ${notFoundSlugs.join(", ")}`);
  console.log(`Errores:              ${errors}`);
  if (errorSlugs.length) console.log(`  -> ${errorSlugs.join(", ")}`);
  console.log("=============================================\n");
}

main()
  .catch((err) => {
    console.error("Error fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

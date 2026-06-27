// =============================================================
//  Pone el campo "size" (medida visible) en los productos de
//  Cadenas, a partir del sizeCm ya recolectado en
//  scripts/price-correction-data.json (carpetas 40/45/50/60 cm
//  de Drive).
// =============================================================
//
//   node scripts/set-cadenas-size.mjs
//
// =============================================================

import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const items = JSON.parse(readFileSync("./scripts/price-correction-data.json", "utf-8"));
  const cadenas = items.filter((i) => i.category === "cadenas" && i.sizeCm);

  console.log(`Cadenas con medida a aplicar: ${cadenas.length}`);

  let updated = 0;
  let notFound = 0;

  for (const item of cadenas) {
    try {
      await prisma.product.update({
        where: { slug: item.code },
        data: { size: `${item.sizeCm} cm` },
      });
      updated += 1;
    } catch (err) {
      if (err.code === "P2025") {
        notFound += 1;
        console.warn(`⚠️  ${item.code}: no existe, se omite.`);
      } else {
        throw err;
      }
    }
  }

  console.log(`\n✅ Actualizados: ${updated}`);
  console.log(`⚠️  No encontrados: ${notFound}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error fatal:", err);
  await prisma.$disconnect();
  process.exit(1);
});

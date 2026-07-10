// =============================================================
//  Marca N productos aleatorios de la tienda pública como
//  "En promoción" (Product.isPromo) para probar la sección de
//  promociones de la home.
//
//    node scripts/set-promos-demo.mjs          (marca 6 al azar)
//    node scripts/set-promos-demo.mjs 8        (marca 8 al azar)
//    node scripts/set-promos-demo.mjs --clear  (desmarca todos)
//
//  En producción las promociones se manejan desde /admin con el
//  checkbox "En promoción" — este script es solo para pruebas.
// =============================================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  if (process.argv.includes("--clear")) {
    const res = await prisma.product.updateMany({
      where: { isPromo: true },
      data: { isPromo: false },
    });
    console.log(`✅ Promociones desmarcadas: ${res.count}`);
    return;
  }

  const take = Number(process.argv[2]) || 6;
  const candidates = await prisma.product.findMany({
    where: { isRetail: true },
    select: { id: true, name: true, slug: true },
  });
  const chosen = candidates.sort(() => Math.random() - 0.5).slice(0, take);

  await prisma.product.updateMany({
    where: { id: { in: chosen.map((p) => p.id) } },
    data: { isPromo: true },
  });

  console.log(`✅ Marcados en promoción (${chosen.length}):`);
  for (const p of chosen) console.log(`   - ${p.name} (${p.slug})`);
}

main()
  .catch((err) => {
    console.error("Error fatal:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

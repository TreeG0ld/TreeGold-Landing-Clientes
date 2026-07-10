// =============================================================
//  Agrega la columna Product.isPromo (sección de promociones de
//  la home, se activa por producto desde /admin).
//
//  El proyecto no usa `prisma migrate`: el schema se aplica con
//  scripts idempotentes como este (ADD COLUMN IF NOT EXISTS).
//
//    node scripts/add-ispromo.mjs
//
// =============================================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isPromo" BOOLEAN NOT NULL DEFAULT false`
  );
  console.log("✅ Columna Product.isPromo lista.");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error fatal:", err);
  await prisma.$disconnect();
  process.exit(1);
});

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log("Últimos productos creados:");
  console.log(products.map(p => ({ id: p.id, name: p.name, created: p.createdAt })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = "juandiego";
  const rawPassword = "12345";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const existing = await prisma.user.findFirst({
    where: { email: adminEmail }
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: hashedPassword, role: "ADMIN" }
    });
    console.log(`Updated existing user: ${adminEmail}`);
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Juan Diego",
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

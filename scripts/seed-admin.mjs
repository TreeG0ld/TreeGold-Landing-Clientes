import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_USER?.trim() || "admin";
  const rawPassword = process.env.ADMIN_PASSWORD?.trim() || "admin123";

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existingAdmin) {
    console.log(`Admin user already exists with email: ${existingAdmin.email}`);
    // Update password just in case
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { password: hashedPassword, email: adminEmail }
    });
    console.log("Admin password updated.");
    return;
  }

  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Administrador",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`Admin user created with email: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

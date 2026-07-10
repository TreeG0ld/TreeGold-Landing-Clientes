// =============================================================
//  Separa la categoría "Cadenas" en "Cadenas mujer" y
//  "Cadenas hombre" según la medida (Product.size):
//    40/45/50 cm -> Cadenas mujer
//    60/65 cm    -> Cadenas hombre
//  y crea las categorías nuevas "Manillas tejidas" y
//  "Anillos tejidos" (vacías, para cargar productos después).
//
//  Al final, si la categoría "cadenas" quedó sin productos, la
//  elimina. Los productos cuya medida no encaje en ningún rango
//  se reportan y NO se mueven (quedan en "cadenas" y la
//  categoría no se borra hasta resolverlos).
//
//  Es IDEMPOTENTE: re-ejecutarlo no duplica categorías ni
//  vuelve a mover productos ya movidos.
//
//  Uso:
//    node scripts/split-cadenas-genero.mjs --dry-run   (solo reporta)
//    node scripts/split-cadenas-genero.mjs             (aplica)
//
// =============================================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes("--dry-run");

const MUJER_CM = [40, 45, 50];
const HOMBRE_CM = [60, 65];

// Extrae los centímetros de un size tipo "45 cm" / "45cm". Devuelve null si
// no hay un número reconocible.
function parseCm(size) {
  const m = /(\d+)\s*cm/i.exec(size ?? "");
  return m ? Number(m[1]) : null;
}

async function ensureCategory(name, slug) {
  const cat = await prisma.category.upsert({
    where: { slug },
    update: {},
    create: { name, slug },
  });
  return cat;
}

async function main() {
  if (DRY_RUN) console.log("— DRY RUN: no se escribe nada —\n");

  // 1. Categorías nuevas (upsert = idempotente).
  let mujer, hombre;
  if (!DRY_RUN) {
    mujer = await ensureCategory("Cadenas mujer", "cadenas-mujer");
    hombre = await ensureCategory("Cadenas hombre", "cadenas-hombre");
    await ensureCategory("Manillas tejidas", "manillas-tejidas");
    await ensureCategory("Anillos tejidos", "anillos-tejidos");
    console.log("Categorías aseguradas: cadenas-mujer, cadenas-hombre, manillas-tejidas, anillos-tejidos\n");
  }

  // 2. Productos aún en la categoría genérica "cadenas".
  const cadenas = await prisma.product.findMany({
    where: { category: { slug: "cadenas" } },
    select: { id: true, slug: true, name: true, size: true },
  });
  console.log(`Productos en "cadenas": ${cadenas.length}`);

  const toMujer = [];
  const toHombre = [];
  const unresolved = [];
  for (const p of cadenas) {
    const cm = parseCm(p.size);
    if (cm !== null && MUJER_CM.includes(cm)) toMujer.push(p);
    else if (cm !== null && HOMBRE_CM.includes(cm)) toHombre.push(p);
    else unresolved.push(p);
  }

  console.log(`  → Cadenas mujer (40/45/50 cm): ${toMujer.length}`);
  console.log(`  → Cadenas hombre (60/65 cm):   ${toHombre.length}`);
  console.log(`  → Sin clasificar:              ${unresolved.length}`);
  for (const p of unresolved) {
    console.log(`     ⚠️  ${p.slug} — size: ${JSON.stringify(p.size)} (${p.name})`);
  }

  if (DRY_RUN) {
    await prisma.$disconnect();
    return;
  }

  // 3. Mover en dos updateMany (una por destino).
  if (toMujer.length) {
    await prisma.product.updateMany({
      where: { id: { in: toMujer.map((p) => p.id) } },
      data: { categoryId: mujer.id },
    });
  }
  if (toHombre.length) {
    await prisma.product.updateMany({
      where: { id: { in: toHombre.map((p) => p.id) } },
      data: { categoryId: hombre.id },
    });
  }
  console.log(`\n✅ Movidos: ${toMujer.length} a mujer, ${toHombre.length} a hombre.`);

  // 4. Borrar la categoría genérica solo si quedó vacía.
  const remaining = await prisma.product.count({ where: { category: { slug: "cadenas" } } });
  if (remaining === 0) {
    await prisma.category.deleteMany({ where: { slug: "cadenas" } });
    console.log('✅ Categoría "cadenas" eliminada (quedó vacía).');
  } else {
    console.log(`⚠️  Quedan ${remaining} productos sin clasificar en "cadenas"; la categoría NO se borra.`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Error fatal:", err);
  await prisma.$disconnect();
  process.exit(1);
});

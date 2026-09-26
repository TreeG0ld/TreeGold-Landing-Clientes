// Capa de datos para la tienda de mayoristas (/mayoristas-<código>).
// Reutiliza Prisma directo (sin cache): es de bajo tráfico y los precios de
// costo deben verse siempre frescos, recién corregidos en el panel /admin.

import { prisma } from "@/lib/prisma";
import { matchesSearch, searchWords } from "@/lib/search-text";

export type WholesaleProduct = {
  slug: string;
  name: string;
  category: string;
  categoryName: string;
  price: number; // wholesalePrice (o retailPrice si no hay costo cargado)
  retailPrice: number; // precio sugerido de venta al público
  material: string;
  // Medida visible ("Talla 7", "45 cm"...). El distribuidor la necesita para
  // saber qué está pidiendo: sin ella dos referencias del mismo modelo en
  // tallas distintas se ven idénticas.
  size: string;
  description: string;
  images: string[];
};

function toWholesaleProduct(p: {
  slug: string;
  name: string;
  retailPrice: number;
  wholesalePrice: number | null;
  material: string | null;
  size: string | null;
  description: string;
  images: string[];
  category: { slug: string; name: string };
}): WholesaleProduct {
  return {
    slug: p.slug,
    name: p.name,
    category: p.category.slug,
    categoryName: p.category.name,
    price: p.wholesalePrice ?? p.retailPrice,
    retailPrice: p.retailPrice,
    material: p.material ?? "",
    size: p.size ?? "",
    description: p.description ?? "",
    images: p.images,
  };
}

// `q` se filtra en Node y no en SQL, igual que en la tienda pública: Postgres
// no ignora las tildes sin la extensión `unaccent`, así que "trebol" no
// encontraría "Topo trébol". La consulta ya trae la categoría completa (unos
// cientos de filas), así que descartar por nombre encima no cuesta nada.
export async function getWholesaleProducts(
  categorySlug?: string,
  q = ""
): Promise<WholesaleProduct[]> {
  const rows = await prisma.product.findMany({
    where: {
      isWholesale: true,
      ...(categorySlug && categorySlug !== "todos" ? { category: { slug: categorySlug } } : {}),
    },
    select: {
      slug: true,
      name: true,
      retailPrice: true,
      wholesalePrice: true,
      material: true,
      size: true,
      description: true,
      images: true,
      category: { select: { slug: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const words = searchWords(q);
  const filtradas = words.length
    ? rows.filter((r) => matchesSearch(r.name, words))
    : rows;

  return filtradas.map(toWholesaleProduct);
}

export async function getWholesaleCategories(): Promise<{ slug: string; name: string }[]> {
  const cats = await prisma.category.findMany({
    where: { products: { some: { isWholesale: true } } },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });
  return cats;
}

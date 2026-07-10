// Capa de datos para la tienda de mayoristas (/mayoristas-<código>).
// Reutiliza Prisma directo (sin cache): es de bajo tráfico y los precios de
// costo deben verse siempre frescos, recién corregidos en el panel /admin.

import { prisma } from "@/lib/prisma";

export type WholesaleProduct = {
  slug: string;
  name: string;
  category: string;
  categoryName: string;
  price: number; // wholesalePrice (o retailPrice si no hay costo cargado)
  retailPrice: number; // precio sugerido de venta al público
  material: string;
  images: string[];
};

function toWholesaleProduct(p: {
  slug: string;
  name: string;
  retailPrice: number;
  wholesalePrice: number | null;
  material: string | null;
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
    images: p.images,
  };
}

export async function getWholesaleProducts(categorySlug?: string): Promise<WholesaleProduct[]> {
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
      images: true,
      category: { select: { slug: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toWholesaleProduct);
}

export async function getWholesaleCategories(): Promise<{ slug: string; name: string }[]> {
  const cats = await prisma.category.findMany({
    where: { products: { some: { isWholesale: true } } },
    select: { slug: true, name: true },
    orderBy: { name: "asc" },
  });
  return cats;
}

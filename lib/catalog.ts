// Capa de datos del catálogo: lee de Supabase (Prisma) y entrega los
// productos/categorías en la MISMA forma que ya usan los componentes,
// para no tener que reescribir ProductCard, ProductDetail, etc.

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import type { Product, Category } from "@/lib/products";

// Productos por página en el catálogo.
export const PER_PAGE = 24;

type DbProduct = {
  slug: string;
  name: string;
  description: string;
  retailPrice: number;
  material: string | null;
  images: string[];
  category: { slug: string; name: string };
};

// Convierte un producto de la base de datos a la forma de la interfaz.
function toUiProduct(p: DbProduct): Product {
  const details = [p.category.name];
  if (p.material) details.push(p.material);
  // Descripción por defecto (SEO + página) cuando el producto aún no tiene una.
  const description =
    p.description?.trim() ||
    `${p.name} — ${p.category.name} de ${site.fullName}. Joyería hecha a mano en oro 18k y plata 925. Consulta disponibilidad y precio por WhatsApp.`;
  return {
    slug: p.slug,
    name: p.name,
    category: p.category.slug,
    price: p.retailPrice,
    material: p.material ?? "",
    description,
    details,
    images: p.images,
  };
}

const withCategory = { include: { category: true } } as const;

// Versión ligera para el listado del catálogo: solo lo que pinta la tarjeta.
// Evita enviar al cliente la descripción larga y las imágenes extra de 660
// productos (reduce mucho el peso de la página de colección).
function toListProduct(p: {
  slug: string;
  name: string;
  retailPrice: number;
  material: string | null;
  images: string[];
  category: { slug: string };
}): Product {
  return {
    slug: p.slug,
    name: p.name,
    category: p.category.slug,
    price: p.retailPrice,
    material: p.material ?? "",
    description: "",
    details: [],
    images: p.images.slice(0, 1),
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isRetail: true },
    select: {
      slug: true,
      name: true,
      retailPrice: true,
      material: true,
      images: true,
      category: { select: { slug: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toListProduct);
}

export type CatalogSort = "destacados" | "precio-asc" | "precio-desc";

export type CatalogPage = {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
};

// Página del catálogo: filtra por categoría, ordena y pagina EN EL SERVIDOR.
// Cacheada 1h (revalida con la tag "catalogo") para que la página dinámica
// responda rápido sin golpear la base de datos en cada visita.
export const getCatalogPage = unstable_cache(
  async (
    category: string,
    sort: CatalogSort,
    page: number
  ): Promise<CatalogPage> => {
    const safePage = Math.max(1, page || 1);
    const where = {
      isRetail: true,
      ...(category && category !== "todos" ? { category: { slug: category } } : {}),
    };
    const orderBy =
      sort === "precio-asc"
        ? { retailPrice: "asc" as const }
        : sort === "precio-desc"
          ? { retailPrice: "desc" as const }
          : { createdAt: "asc" as const };

    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          slug: true,
          name: true,
          retailPrice: true,
          material: true,
          images: true,
          category: { select: { slug: true } },
        },
        orderBy,
        skip: (safePage - 1) * PER_PAGE,
        take: PER_PAGE,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: rows.map(toListProduct),
      total,
      page: safePage,
      totalPages: Math.max(1, Math.ceil(total / PER_PAGE)),
    };
  },
  ["catalog-page"],
  { revalidate: 3600, tags: ["catalogo"] }
);

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const p = await prisma.product.findUnique({ where: { slug }, ...withCategory });
  return p ? toUiProduct(p) : null;
}

export async function getRelated(
  categorySlug: string,
  excludeSlug: string,
  take = 4
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isRetail: true, category: { slug: categorySlug }, slug: { not: excludeSlug } },
    ...withCategory,
    take,
  });
  return rows.map(toUiProduct);
}

export async function getFeatured(take = 8): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isRetail: true },
    ...withCategory,
    orderBy: { createdAt: "asc" },
    take,
  });
  return rows.map(toUiProduct);
}

export const getAllCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const cats = await prisma.category.findMany({ orderBy: { name: "asc" } });
    // Imagen de portada = primera foto de un producto de esa categoría.
    return Promise.all(
      cats.map(async (c) => {
        const first = await prisma.product.findFirst({
          where: { categoryId: c.id, isRetail: true },
          select: { images: true },
          orderBy: { createdAt: "asc" },
        });
        return {
          slug: c.slug,
          name: c.name,
          description: "",
          image: first?.images[0] ?? "",
        } satisfies Category;
      })
    );
  },
  ["all-categories"],
  { revalidate: 3600, tags: ["catalogo"] }
);

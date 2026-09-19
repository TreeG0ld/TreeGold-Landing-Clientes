// Capa de datos del catálogo: lee de Supabase (Prisma) y entrega los
// productos/categorías en la MISMA forma que ya usan los componentes,
// para no tener que reescribir ProductCard, ProductDetail, etc.

import { cache } from "react";
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
  originalPrice: number | null;
  isPromo: boolean;
  material: string | null;
  size: string | null;
  images: string[];
  category: { slug: string; name: string };
};

// Convierte un producto de la base de datos a la forma de la interfaz.
function toUiProduct(p: DbProduct): Product {
  const details = [p.category.name];
  if (p.material) details.push(p.material);
  if (p.size) details.push(p.size);
  // Descripción por defecto (SEO + página) cuando el producto aún no tiene una.
  const description =
    p.description?.trim() ||
    `${p.name} — ${p.category.name} de ${site.fullName}, en oro laminado y plata 925. Consulta disponibilidad y precio por WhatsApp.`;
  return {
    slug: p.slug,
    name: p.name,
    category: p.category.slug,
    price: p.retailPrice,
    originalPrice: p.originalPrice ?? undefined,
    isPromo: p.isPromo,
    material: p.material ?? "",
    size: p.size ?? undefined,
    description,
    details,
    images: p.images,
  };
}

// Columnas mínimas que necesita una TARJETA de producto (ProductCard).
// Traer solo esto en los listados evita arrastrar la descripción larga y las
// fotos extra de cada producto desde la base de datos hasta el navegador.
const listSelect = {
  slug: true,
  name: true,
  retailPrice: true,
  originalPrice: true,
  isPromo: true,
  material: true,
  size: true,
  images: true,
  category: { select: { slug: true } },
} as const;

// Columnas de la FICHA de producto: aquí sí hacen falta la descripción y todas
// las fotos de la galería. `categoryId` se usa para buscar los relacionados
// entrando directo por el índice, sin volver a tocar la tabla Category.
const detailSelect = {
  slug: true,
  name: true,
  description: true,
  retailPrice: true,
  originalPrice: true,
  isPromo: true,
  material: true,
  size: true,
  images: true,
  categoryId: true,
  category: { select: { slug: true, name: true } },
} as const;

// Versión ligera para el listado del catálogo: solo lo que pinta la tarjeta.
// Evita enviar al cliente la descripción larga y las imágenes extra de 660
// productos (reduce mucho el peso de la página de colección).
function toListProduct(p: {
  slug: string;
  name: string;
  retailPrice: number;
  originalPrice: number | null;
  isPromo: boolean;
  material: string | null;
  size: string | null;
  images: string[];
  category: { slug: string };
}): Product {
  return {
    slug: p.slug,
    name: p.name,
    category: p.category.slug,
    price: p.retailPrice,
    originalPrice: p.originalPrice ?? undefined,
    isPromo: p.isPromo,
    material: p.material ?? "",
    size: p.size ?? undefined,
    description: "",
    details: [],
    images: p.images.slice(0, 1),
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isRetail: true },
    select: listSelect,
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

// Deja el texto comparable: sin tildes y en minúscula.
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Palabras del término de búsqueda. Se recorta la "s" final porque el cliente
// escribe el plural ("anillos") y los productos están en singular ("Anillo …").
function searchWords(q: string): string[] {
  return normalize(q)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w));
}

// Índice de búsqueda: solo slug y nombre de lo visible en tienda (~700 filas de
// texto corto). Cacheado con la misma tag que el catálogo, así que se rehace
// solo cuando se crea o edita un producto.
const getSearchIndex = unstable_cache(
  async () =>
    prisma.product.findMany({
      where: { isRetail: true },
      select: { slug: true, name: true },
    }),
  ["product-search-index"],
  { revalidate: 3600, tags: ["catalogo"] }
);

// El filtro por nombre se resuelve en Node y no en SQL porque Postgres no
// ignora las tildes sin la extensión `unaccent`: "trebol" debe encontrar
// "Topo trébol". Exige TODAS las palabras, así "anillo aura" encuentra
// "Anillo Aura" aunque esa frase exacta no esté en el nombre.
async function slugsMatching(q: string): Promise<string[]> {
  const words = searchWords(q);
  if (!words.length) return [];
  const rows = await getSearchIndex();
  return rows
    .filter((r) => {
      const name = normalize(r.name);
      return words.every((w) => name.includes(w));
    })
    .map((r) => r.slug);
}

// Página del catálogo: filtra por categoría y por nombre, ordena y pagina EN EL
// SERVIDOR.
async function queryCatalogPage(
  category: string,
  sort: CatalogSort,
  page: number,
  q: string
): Promise<CatalogPage> {
  const safePage = Math.max(1, page || 1);
  const matches = q ? await slugsMatching(q) : null;
  if (matches && matches.length === 0) {
    return { products: [], total: 0, page: safePage, totalPages: 1 };
  }
  const where = {
    isRetail: true,
    ...(category && category !== "todos" ? { category: { slug: category } } : {}),
    ...(matches ? { slug: { in: matches } } : {}),
  };
  const orderBy =
    sort === "precio-asc"
      ? { retailPrice: "asc" as const }
      : sort === "precio-desc"
        ? { retailPrice: "desc" as const }
        : { createdAt: "desc" as const };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: listSelect,
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
}

// Navegación normal (sin búsqueda): cacheada 1h, revalida con la tag "catalogo".
const getCachedCatalogPage = unstable_cache(queryCatalogPage, ["catalog-page"], {
  revalidate: 3600,
  tags: ["catalogo"],
});

export function getCatalogPage(
  category: string,
  sort: CatalogSort,
  page: number,
  q = ""
): Promise<CatalogPage> {
  // Las búsquedas NO pasan por la caché: la clave sería texto libre del
  // visitante, así que un bot pidiendo términos al azar llenaría la caché de
  // entradas de un solo uso.
  return q
    ? queryCatalogPage(category, sort, page, q)
    : getCachedCatalogPage(category, sort, page, "");
}

// La ficha del producto se pide DOS veces por visita: una en
// `generateMetadata` (título, OG) y otra al renderizar la página. `cache` de
// React memoiza la consulta dentro de la misma petición, así que la base de
// datos solo la responde una vez.
const getProductRow = cache(async (slug: string) =>
  prisma.product.findUnique({ where: { slug }, select: detailSelect })
);

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const p = await getProductRow(slug);
  return p ? toUiProduct(p) : null;
}

// "También te puede gustar": otros productos de la misma categoría.
// Filtra por `categoryId` (no por el slug de la categoría) y ordena por
// `createdAt` para que la consulta entre justo por el índice
// [isRetail, categoryId, createdAt], sin join ni ordenamiento extra.
// Reutiliza la ficha ya cacheada arriba, así que no cuesta una consulta más.
export async function getRelated(slug: string, take = 4): Promise<Product[]> {
  const p = await getProductRow(slug);
  if (!p) return [];

  const rows = await prisma.product.findMany({
    where: { isRetail: true, categoryId: p.categoryId, slug: { not: slug } },
    select: listSelect,
    orderBy: { createdAt: "asc" },
    take,
  });
  return rows.map(toListProduct);
}

// Productos marcados "En promoción" desde /admin (Product.isPromo).
// La home no renderiza la sección si viene vacío.
export async function getPromos(take = 8): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isRetail: true, isPromo: true },
    select: listSelect,
    orderBy: { updatedAt: "desc" },
    take,
  });
  return rows.map(toListProduct);
}

export async function getFeatured(take = 8): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isRetail: true },
    select: listSelect,
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(toListProduct);
}

export const getAllCategories = unstable_cache(
  async (): Promise<Category[]> => {
    // Dos consultas en total (antes: 1 + N, una por categoría). Con `distinct`
    // + orderBy traemos, de una sola vez, el producto más antiguo de cada
    // categoría (su primera foto es la portada).
    const [cats, covers] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.product.findMany({
        where: { isRetail: true },
        select: { categoryId: true, images: true },
        orderBy: [{ categoryId: "asc" }, { createdAt: "asc" }],
        distinct: ["categoryId"],
      }),
    ]);

    const coverByCategory = new Map(covers.map((p) => [p.categoryId, p.images[0] ?? ""]));

    // Solo categorías con al menos un producto visible en la tienda pública:
    // las recién creadas (aún sin productos) no deben aparecer con tarjeta vacía.
    return cats
      .filter((c) => coverByCategory.has(c.id))
      .map(
        (c) =>
          ({
            slug: c.slug,
            name: c.name,
            description: "",
            image: coverByCategory.get(c.id) ?? "",
          }) satisfies Category
      );
  },
  ["all-categories"],
  { revalidate: 3600, tags: ["catalogo"] }
);

// Cuenta real de productos activos en la tienda pública. Se usa en el
// contador de /historia (dato verificable, en vez de una cifra inventada).
export const getActiveProductCount = unstable_cache(
  async (): Promise<number> => prisma.product.count({ where: { isRetail: true } }),
  ["active-product-count"],
  { revalidate: 3600, tags: ["catalogo"] }
);

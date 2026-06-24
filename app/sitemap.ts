import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getAllProducts, getAllCategories } from "@/lib/catalog";

// Se regenera periódicamente junto con el catálogo.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url;

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/coleccion`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/historia`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/contacto`, changeFrequency: "yearly", priority: 0.5 },
  ];

  let products: MetadataRoute.Sitemap = [];
  let categories: MetadataRoute.Sitemap = [];
  try {
    const [prods, cats] = await Promise.all([getAllProducts(), getAllCategories()]);
    products = prods.map((p) => ({
      url: `${base}/producto/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    categories = cats.map((c) => ({
      url: `${base}/coleccion?categoria=${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // Si la base de datos no responde, devolvemos al menos las páginas estáticas.
  }

  return [...staticPages, ...categories, ...products];
}

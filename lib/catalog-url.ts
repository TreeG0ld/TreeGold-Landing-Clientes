// Construye las URLs del catálogo a partir de los filtros.
// Pura (sin dependencias de servidor): la usan tanto la página como el cliente.

export type CatalogQuery = { category?: string; sort?: string; page?: number };

export function coleccionHref({ category, sort, page }: CatalogQuery): string {
  const sp = new URLSearchParams();
  if (category && category !== "todos") sp.set("categoria", category);
  if (sort && sort !== "destacados") sp.set("orden", sort);
  if (page && page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/coleccion${qs ? `?${qs}` : ""}`;
}

export const CATALOG_SORTS = [
  { id: "destacados", label: "Destacados" },
  { id: "precio-asc", label: "Precio: menor a mayor" },
  { id: "precio-desc", label: "Precio: mayor a menor" },
];

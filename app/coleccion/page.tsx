import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import CatalogSort from "@/components/CatalogSort";
import CategoryFilter from "@/components/CategoryFilter";
import Pagination from "@/components/Pagination";
import { getCatalogPage, getAllCategories } from "@/lib/catalog";
import type { CatalogSort as SortKey } from "@/lib/catalog";
import { site } from "@/lib/site";

type SearchParams = Promise<{ categoria?: string; orden?: string; page?: string }>;

const SORT_VALUES: SortKey[] = ["destacados", "precio-asc", "precio-desc"];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { categoria } = await searchParams;
  if (categoria && categoria !== "todos") {
    const name = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    return {
      title: name,
      description: `${name} de ${site.fullName}: piezas en oro laminado y plata 925, hechas a mano. Consulta y compra por WhatsApp.`,
      alternates: { canonical: `/coleccion?categoria=${categoria}` },
    };
  }
  return {
    title: "Colección",
    description:
      "Explora la colección completa de Joyería TreeGold: anillos, cadenas, aretes, dijes, pulseras y más en oro laminado y plata 925.",
    alternates: { canonical: "/coleccion" },
  };
}

export default async function ColeccionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const category = sp.categoria ?? "todos";
  const sort: SortKey = SORT_VALUES.includes(sp.orden as SortKey)
    ? (sp.orden as SortKey)
    : "destacados";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [catalog, categories] = await Promise.all([
    getCatalogPage(category, sort, page),
    getAllCategories(),
  ]);

  const tabs = [{ slug: "todos", name: "Todo" }, ...categories];

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
      <header className="mb-8 text-center">
        <p className="eyebrow mb-3">La colección</p>
        <h1 className="text-5xl md:text-6xl">Joyas TreeGold</h1>
        <p className="mx-auto mt-4 max-w-md text-secondary">
          Piezas únicas hechas a mano. Guarda tus favoritas y finaliza tu pedido
          por WhatsApp.
        </p>
      </header>

      {/* Filtros */}
      <div className="sticky top-16 z-30 -mx-5 mb-10 border-b border-border glass px-5 py-3 md:top-20 md:mx-0 md:rounded-2xl md:border md:px-5 md:py-3.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="md:flex-1">
            <CategoryFilter categories={tabs} value={category} sort={sort} />
          </div>

          <div className="shrink-0 self-end md:self-auto md:border-l md:border-border md:pl-4">
            <CatalogSort category={category} value={sort} />
          </div>
        </div>
      </div>

      {/* Grid (renderizado en el servidor → indexable) */}
      {catalog.products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {catalog.products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-secondary">
          No hay piezas en esta categoría todavía.
        </p>
      )}

      <Pagination
        category={category}
        sort={sort}
        page={catalog.page}
        totalPages={catalog.totalPages}
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import ProductCard from "@/components/ProductCard";
import CatalogSort from "@/components/CatalogSort";
import CategoryFilter from "@/components/CategoryFilter";
import Pagination from "@/components/Pagination";
import { getCatalogPage, getAllCategories } from "@/lib/catalog";
import type { CatalogSort as SortKey } from "@/lib/catalog";
import { rateLimit } from "@/lib/rate-limit";
import { clientIpFromHeaders, rateLimitIp } from "@/lib/client-ip";
import { site } from "@/lib/site";

// El resto del catálogo se sirve de caché, así que el buscador es el único
// punto que llega a la base de datos en cada petición. Tope amplio: una persona
// no encadena 30 búsquedas en un minuto, un bot sí.
const SEARCH_MAX = 30;
const SEARCH_WINDOW_MS = 60 * 1000;

type SearchParams = Promise<{
  categoria?: string;
  orden?: string;
  page?: string;
  q?: string;
}>;

const SORT_VALUES: SortKey[] = ["destacados", "precio-asc", "precio-desc"];

// Canonical de una página paginada: nunca incluye "orden" (una lista
// reordenada es el mismo contenido, no una página distinta — evita
// contenido duplicado), pero SÍ incluye "page" cuando es > 1: la página 2
// de una categoría tiene productos distintos a la página 1, así que debe
// poder indexarse por su cuenta en vez de canonicalizar siempre a la 1.
function paginatedCanonical(base: string, page: number): string {
  if (page <= 1) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}page=${page}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { categoria, page: pageParam, q } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSuffix = page > 1 ? ` · Página ${page}` : "";

  // Una búsqueda no es una página del catálogo: cada término genera una URL
  // distinta con contenido repetido, así que no debe indexarse.
  if (q?.trim()) {
    return {
      title: `Búsqueda: ${q.trim()}`,
      robots: { index: false, follow: true },
    };
  }

  if (categoria && categoria !== "todos") {
    const name = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    return {
      title: `${name}${pageSuffix}`,
      description: `${name} de ${site.fullName}: piezas en oro laminado y plata 925. Consulta y compra por WhatsApp.`,
      alternates: { canonical: paginatedCanonical(`/coleccion?categoria=${categoria}`, page) },
    };
  }
  return {
    title: `Colección${pageSuffix}`,
    description:
      "Explora la colección completa de Joyería TreeGold: anillos, cadenas, aretes, dijes, pulseras y más en oro laminado y plata 925.",
    alternates: { canonical: paginatedCanonical("/coleccion", page) },
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
  const requestedQ = sp.q?.trim() ?? "";

  // A diferencia del login, aquí se falla ABIERTO: si no hay una IP de
  // confianza se deja buscar igual. Dejar sin buscar a un cliente real cuesta
  // más que atender una búsqueda de más.
  let searchThrottled = false;
  if (requestedQ) {
    const ip = clientIpFromHeaders(await headers());
    if (ip) {
      searchThrottled = !rateLimit(
        `search:ip:${rateLimitIp(ip)}`,
        SEARCH_MAX,
        SEARCH_WINDOW_MS
      ).allowed;
    }
  }
  // Frenado: se ignora el término y se muestra el catálogo normal con un aviso,
  // en vez de dejar al cliente en una página de error.
  const q = searchThrottled ? "" : requestedQ;

  const [catalog, categories] = await Promise.all([
    getCatalogPage(category, sort, page, q),
    getAllCategories(),
  ]);

  const tabs = [{ slug: "todos", name: "Todo" }, ...categories];

  const categoryName =
    category !== "todos" ? category.charAt(0).toUpperCase() + category.slice(1) : null;

  // Búsqueda dentro de una categoría que no tiene ninguna coincidencia: en vez
  // de dejar al cliente en una página vacía (parece que la tienda no tuviera
  // nada), se le muestran los resultados de esa misma búsqueda en el resto de
  // categorías.
  const fallback =
    q && category !== "todos" && catalog.total === 0
      ? await getCatalogPage("todos", sort, 1, q)
      : null;
  const shown = fallback ?? catalog;
  const currentCategoryName = tabs.find((t) => t.slug === category)?.name ?? categoryName;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: site.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Colección",
        item: `${site.url}/coleccion`,
      },
      ...(categoryName
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: categoryName,
              item: `${site.url}/coleccion?categoria=${category}`,
            },
          ]
        : []),
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />
      <header className="mb-8 text-center">
        <p className="eyebrow mb-3">{q ? "Búsqueda" : "La colección"}</p>
        <h1 className="text-5xl md:text-6xl">{q ? `“${q}”` : "Joyas TreeGold"}</h1>
        {q ? (
          <>
            <p className="mx-auto mt-4 max-w-md text-secondary">
              {shown.total === 1
                ? "1 pieza encontrada"
                : `${shown.total} piezas encontradas`}
            </p>
            <Link
              href="/coleccion"
              className="mt-3 inline-block text-sm text-accent underline-offset-4 hover:underline"
            >
              Ver toda la colección
            </Link>
          </>
        ) : (
          <p className="mx-auto mt-4 max-w-md text-secondary">
            Piezas seleccionadas en oro laminado y plata 925. Guarda tus favoritas
            y finaliza tu pedido por WhatsApp.
          </p>
        )}
      </header>

      {/* Filtros */}
      <div className="sticky top-16 z-30 -mx-5 mb-10 border-b border-border glass px-5 py-3 md:top-20 md:mx-0 md:rounded-2xl md:border md:px-5 md:py-3.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="md:flex-1">
            <CategoryFilter categories={tabs} value={category} sort={sort} q={q} />
          </div>

          <div className="shrink-0 self-end md:self-auto md:border-l md:border-border md:pl-4">
            <CatalogSort category={category} value={sort} q={q} />
          </div>
        </div>
      </div>

      {searchThrottled && (
        <p className="mb-8 rounded-2xl border border-border bg-muted/40 px-5 py-4 text-center text-sm text-secondary">
          Has hecho muchas búsquedas seguidas. Espera un momento y vuelve a
          intentarlo.
        </p>
      )}

      {fallback && fallback.total > 0 && (
        <p className="mb-8 text-center text-secondary">
          No hay <span className="text-primary">“{q}”</span> en {currentCategoryName}, pero
          estas coinciden en otras categorías:
        </p>
      )}

      {/* Grid (renderizado en el servidor → indexable) */}
      {shown.products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {shown.products.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-secondary">
          {q
            ? `No encontramos joyas con “${q}”. Prueba con otra palabra.`
            : "No hay piezas en esta categoría todavía."}
        </p>
      )}

      <Pagination
        category={fallback ? "todos" : category}
        sort={sort}
        page={shown.page}
        totalPages={shown.totalPages}
        q={q}
      />
    </div>
  );
}

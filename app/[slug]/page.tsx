// Catch-all de nivel raíz: SOLO existe para soportar la URL secreta
// /mayoristas-<código>. Next.js App Router no permite mezclar texto fijo
// con un segmento dinámico en la misma carpeta (ej. "mayoristas-[codigo]"
// no funciona), así que se atrapa cualquier slug no reconocido aquí y se
// revisa manualmente si empieza con "mayoristas-". Las rutas estáticas
// (coleccion, historia, contacto, etc.) siempre tienen prioridad sobre este
// catch-all, así que no hay conflicto.
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getWholesaleProducts, getWholesaleCategories } from "@/lib/wholesale";
import WholesaleProductCard from "@/components/WholesaleProductCard";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const PREFIX = "mayoristas-";

export default async function CatchAllPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { slug } = await params;

  if (!slug.startsWith(PREFIX)) notFound();
  const codigo = slug.slice(PREFIX.length);

  const secret = process.env.WHOLESALE_SECRET;
  if (!secret || codigo !== secret) notFound();

  const { categoria } = await searchParams;
  const category = categoria ?? "todos";

  const [products, categories] = await Promise.all([
    getWholesaleProducts(category),
    getWholesaleCategories(),
  ]);

  const tabs = [{ slug: "todos", name: "Todo" }, ...categories];

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-12 md:px-8">
      <header className="mb-8">
        <p className="eyebrow mb-3">Acceso privado</p>
        <h1 className="text-4xl md:text-5xl">Catálogo mayoristas</h1>
        <p className="mt-3 max-w-xl text-secondary">
          Precios de costo, solo para distribuidores. No compartas este enlace.
        </p>
      </header>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => {
          const active = category === t.slug;
          return (
            <Link
              key={t.slug}
              href={`/${PREFIX}${codigo}${t.slug === "todos" ? "" : `?categoria=${t.slug}`}`}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active ? "bg-primary text-white" : "text-secondary hover:text-primary"
              }`}
            >
              {t.name}
            </Link>
          );
        })}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {products.map((p) => (
            <WholesaleProductCard key={p.slug} product={p} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-secondary">
          Todavía no hay productos marcados como "Visible en mayoristas". Actívalos desde
          el panel /admin en cada producto.
        </p>
      )}
    </div>
  );
}

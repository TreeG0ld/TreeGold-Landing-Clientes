// Catch-all de nivel raíz: SOLO existe para soportar la URL secreta
// /mayoristas-<código>. Next.js App Router no permite mezclar texto fijo
// con un segmento dinámico en la misma carpeta (ej. "mayoristas-[codigo]"
// no funciona), así que se atrapa cualquier slug no reconocido aquí y se
// revisa manualmente si empieza con "mayoristas-". Las rutas estáticas
// (coleccion, historia, contacto, etc.) siempre tienen prioridad sobre este
// catch-all, así que no hay conflicto.
//
// La página es deliberadamente NEUTRA: sin logo, sin nombre de la marca,
// sin navbar ni footer (ver SiteChrome). Solo el catálogo y los precios.
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { getWholesaleProducts, getWholesaleCategories } from "@/lib/wholesale";
import {
  WHOLESALE_PREFIX as PREFIX,
  extractWholesaleCode,
  isValidWholesaleCode,
} from "@/lib/wholesale-auth";
import { clientIpFromHeaders, rateLimitIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";
import WholesaleProductCard from "@/components/WholesaleProductCard";
import WholesaleOrder from "@/components/WholesaleOrder";
import WholesaleSearch from "@/components/WholesaleSearch";

// El código es corto y fijo (una sola constante, sin BD detrás), así que sin
// límite se puede recorrer por fuerza bruta a base de peticiones GET
// normales, sin necesidad de falsificar nada. 30/10 min por IP: generoso
// para el uso real (un distribuidor guarda el enlace y lo abre pocas veces
// al día) pero bastante bajo el ritmo que necesitaría un ataque de fuerza
// bruta para tener alguna chance contra un secreto de longitud razonable.
const WHOLESALE_MAX_ATTEMPTS = 30;
const WHOLESALE_WINDOW_MS = 10 * 60 * 1000;

export const metadata: Metadata = {
  // "absolute" evita la plantilla global ("%s · Joyería TreeGold"):
  // la pestaña del navegador tampoco revela la marca.
  title: { absolute: "Catálogo Privado" },
  description: "Catálogo privado para distribuidores.",
  robots: { index: false, follow: false },
  // Sobrescribe el OpenGraph/Twitter heredado del layout raíz: sin esto, al
  // compartir el enlace por WhatsApp la vista previa mostraría el nombre y el
  // logo de la marca. Aquí la tarjeta queda neutra.
  openGraph: {
    title: "Catálogo Privado",
    description: "Acceso exclusivo para distribuidores.",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "Catálogo Privado",
    description: "Acceso exclusivo para distribuidores.",
    images: [],
  },
};

export default async function CatchAllPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const { slug } = await params;

  const codigo = extractWholesaleCode(slug);
  // Solo se gasta cupo en slugs que de verdad empiezan por "mayoristas-": el
  // resto del catch-all (cualquier ruta 404 normal del sitio) no debe
  // consumir esta cubeta.
  if (codigo !== null) {
    const ip = clientIpFromHeaders(await headers());
    // Fail-closed, igual que en login/registro: sin IP de confianza no hay
    // límite que valga, así que se rechaza en vez de compartir cubeta.
    if (!ip) notFound();
    const limit = rateLimit(`wholesale:ip:${rateLimitIp(ip)}`, WHOLESALE_MAX_ATTEMPTS, WHOLESALE_WINDOW_MS);
    if (!limit.allowed) notFound();
  }
  if (!(await isValidWholesaleCode(codigo))) notFound();

  const { categoria, q } = await searchParams;
  const category = categoria ?? "todos";
  const query = q?.trim() ?? "";

  const [products, categories] = await Promise.all([
    getWholesaleProducts(category, query),
    getWholesaleCategories(),
  ]);

  const tabs = [{ slug: "todos", name: "Todo" }, ...categories];
  const base = `/${PREFIX}${codigo}`;

  return (
    <div className="min-h-dvh bg-background">
      {/* Cabecera oscura, elegante y anónima */}
      <header className="bg-primary text-on-primary">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-luxe text-accent-soft">
            <ShieldCheck className="h-3.5 w-3.5" /> Acceso privado
          </p>
          <h1 className="font-serif text-4xl text-white md:text-6xl">
            Catálogo Mayorista
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 md:text-base">
            Precios exclusivos para distribuidores. Este enlace es personal:
            no lo compartas ni lo publiques.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        {/* Filtros por categoría (sticky) */}
        <div className="sticky top-0 z-30 -mx-5 mb-10 border-b border-border glass px-5 py-3 md:mx-0 md:mt-6 md:rounded-full md:border md:px-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-2 overflow-x-auto pb-1 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tabs.map((t) => {
                const active = category === t.slug;
                return (
                  <Link
                    key={t.slug}
                    href={`${base}${
                      [
                        t.slug === "todos" ? "" : `categoria=${t.slug}`,
                        query ? `q=${encodeURIComponent(query)}` : "",
                      ]
                        .filter(Boolean)
                        .reduce((acc, p, i) => (i === 0 ? `?${p}` : `${acc}&${p}`), "")
                    }`}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                      active
                        ? "bg-primary text-white"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    {t.name}
                  </Link>
                );
              })}
            </div>
            <span className="hidden shrink-0 pr-2 text-xs text-secondary/70 sm:block">
              {products.length} {products.length === 1 ? "pieza" : "piezas"}
            </span>
            <WholesaleSearch base={base} categoria={category} initialQuery={query} />
          </div>
        </div>

        {/* Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 pt-2 lg:grid-cols-4">
            {products.map((p, i) => (
              <div
                key={p.slug}
                className="cascade"
                style={{ "--i": i % 8 } as React.CSSProperties}
              >
                <WholesaleProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-24 text-center text-secondary">
            {query
              ? `No encontramos piezas con “${query}”. Prueba con otra palabra.`
              : "No hay piezas disponibles en esta categoría por ahora."}
          </p>
        )}

        {/* Pie neutro, sin marca. pb extra: la barra del pedido es fija y
            taparía las últimas líneas. */}
        <footer className="mt-20 border-t border-border pb-16 pt-8 text-center text-xs text-secondary/60">
          Catálogo privado · Los precios pueden cambiar sin aviso · Pedidos por WhatsApp
        </footer>
      </div>

      <WholesaleOrder />
    </div>
  );
}

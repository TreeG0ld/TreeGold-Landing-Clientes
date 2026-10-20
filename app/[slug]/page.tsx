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
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import {
  getWholesaleProducts,
  getWholesaleCategories,
  getWholesaleCategoryTiles,
} from "@/lib/wholesale";
import {
  WHOLESALE_PREFIX as PREFIX,
  extractWholesaleCode,
  isValidWholesaleCode,
} from "@/lib/wholesale-auth";
import { clientIpFromHeaders, rateLimitIp } from "@/lib/client-ip";
import { rateLimit, refundRateLimit } from "@/lib/rate-limit";
import WholesaleProductCard from "@/components/WholesaleProductCard";
import WholesaleOrder from "@/components/WholesaleOrder";
import WholesaleSearch from "@/components/WholesaleSearch";
import WholesaleCategoryGrid from "@/components/WholesaleCategoryGrid";
import BalinesNoticeModal from "@/components/BalinesNoticeModal";
import { BALINES_CATEGORY, groupBalines } from "@/lib/wholesale-rules";

// El código es corto y fijo (una sola constante, sin BD detrás), así que sin
// límite se puede recorrer por fuerza bruta a base de peticiones GET
// normales, sin necesidad de falsificar nada. 30 intentos FALLIDOS cada 10
// min por IP: las visitas con el código correcto devuelven su intento (ver
// refundRateLimit más abajo), así que un distribuidor puede navegar sin
// límite, y 30 sigue muy por debajo del ritmo que necesitaría un ataque de
// fuerza bruta para tener alguna chance contra un secreto razonable.
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
  let limitKey: string | null = null;
  if (codigo !== null) {
    const ip = clientIpFromHeaders(await headers());
    // Fail-closed, igual que en login/registro: sin IP de confianza no hay
    // límite que valga, así que se rechaza en vez de compartir cubeta.
    if (!ip) notFound();
    limitKey = `wholesale:ip:${rateLimitIp(ip)}`;
    const limit = rateLimit(limitKey, WHOLESALE_MAX_ATTEMPTS, WHOLESALE_WINDOW_MS);
    if (!limit.allowed) notFound();
  }
  if (!(await isValidWholesaleCode(codigo))) notFound();
  // Código correcto: se devuelve el intento. El límite solo debe frenar a
  // quien prueba códigos al azar; antes contaba también cada búsqueda,
  // pestaña o recarga de un distribuidor legítimo, y explorando el catálogo
  // llegaba a 30 en pocos minutos y veía un 404. Los intentos fallidos se
  // siguen acumulando igual (refundRateLimit solo devuelve lo que gastó esta
  // misma petición), y una IP ya bloqueada no llega hasta aquí.
  if (limitKey) refundRateLimit(limitKey);

  const { categoria, q } = await searchParams;
  const category = categoria ?? "todos";
  const query = q?.trim() ?? "";
  // Sin categoría ni búsqueda, el catálogo abre con la cuadrícula de
  // categorías (y no carga piezas). "Ver todo" es ?categoria=todos.
  const landing = !categoria && !query;

  // Con búsqueda se trae lo que coincide en TODAS las categorías: antes se
  // buscaba solo dentro de la pestaña elegida, y "tio rico" en "Anillos" daba
  // cero aunque hubiera piezas en otras categorías. De ese total salen los
  // conteos de cada pestaña y, filtrando aquí, la categoría elegida.
  const [found, categories, tiles] = await Promise.all([
    landing ? Promise.resolve([]) : getWholesaleProducts(query ? "todos" : category, query),
    getWholesaleCategories(),
    landing ? getWholesaleCategoryTiles() : Promise.resolve([]),
  ]);

  const matchesByCategory = new Map<string, number>();
  if (query) {
    for (const p of found) {
      matchesByCategory.set(p.category, (matchesByCategory.get(p.category) ?? 0) + 1);
    }
  }
  const products =
    query && category !== "todos" ? found.filter((p) => p.category === category) : found;

  // Buscando, solo quedan las pestañas con resultados (más la activa, si se
  // llegó a una vacía por un enlace viejo): así no se puede caer en una
  // categoría vacía sin saberlo.
  const tabs = [
    { slug: "todos", name: "Todo", count: query ? found.length : null },
    ...categories.map((c) => ({
      ...c,
      count: query ? matchesByCategory.get(c.slug) ?? 0 : null,
    })),
  ].filter((t) => t.count !== 0 || t.slug === category);
  const base = `/${PREFIX}${codigo}`;
  const categoryName =
    category === "todos" ? "Todas las categorías" : categories.find((c) => c.slug === category)?.name ?? "";
  const piezas = (n: number) => `${n} ${n === 1 ? "pieza" : "piezas"}`;

  return (
    <div className="min-h-dvh bg-background font-jakarta">
      {/* Banner / Hero de Mayoristas:
          Mantiene la altura original compacta (~210px en móvil, ~280-300px en desktop)
          para que no desplace el catálogo ni redimensione la página.
          La imagen se adapta a la altura con su proporción natural (1024/571)
          y los laterales en pantallas anchas se visten con atmósfera ambiental
          y beneficios clave para el distribuidor. */}
      <header className="relative w-full overflow-hidden bg-primary text-white">
        {/* Fondo ambiental: extensión visual difuminada del banner */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <Image
            src="https://ik.imagekit.io/jmbbfxnqu/treegold/marca/banner-mayoristas.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover scale-125 blur-3xl opacity-30 brightness-90 saturate-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-primary/80" />
        </div>

        {/* Contenedor principal con la altura compacta original */}
        <div className="relative mx-auto flex h-[210px] sm:h-[250px] md:h-[280px] lg:h-[300px] max-w-7xl items-center justify-between px-3 sm:px-6 md:px-8">
          {/* Lado izquierdo (Desktop): Propuesta de valor 1 */}
          <div className="hidden lg:flex flex-col justify-center gap-2 max-w-[220px] xl:max-w-[260px] text-left z-10">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[0.68rem] font-medium uppercase tracking-luxe text-accent-soft backdrop-blur-md">
              <ShieldCheck className="h-3 w-3 text-accent" /> Acceso Privado
            </span>
            <p className="font-prata text-base xl:text-lg text-white leading-snug">
              Precios directos de fábrica
            </p>
            <p className="text-xs text-white/65 font-jakarta leading-relaxed">
              Oro laminado 18K y balinería con garantía para tu negocio.
            </p>
          </div>

          {/* Banner central: se adapta exactamente a la altura del hero sin recortes ni deformaciones */}
          <div className="relative h-full aspect-[1024/571] max-w-full shrink-0 mx-auto overflow-hidden shadow-2xl rounded-xl sm:rounded-2xl border border-white/10">
            <Image
              src="https://ik.imagekit.io/jmbbfxnqu/treegold/marca/banner-mayoristas.jpg"
              alt="Catálogo Mayorista — El momento de emprender es ahora"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 700px"
              className="object-contain"
            />
            {/* Badge de acceso privado en móviles / tablets */}
            <div className="absolute left-3 top-3 z-10 lg:hidden">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-luxe text-white backdrop-blur-md">
                <ShieldCheck className="h-3 w-3 text-accent-soft" /> Acceso privado
              </span>
            </div>
          </div>

          {/* Lado derecho (Desktop): Propuesta de valor 2 */}
          <div className="hidden lg:flex flex-col justify-center items-end gap-2 max-w-[220px] xl:max-w-[260px] text-right z-10">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-[0.68rem] font-medium uppercase tracking-luxe text-accent-soft backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-accent" /> Margen 100%+
            </span>
            <p className="font-prata text-base xl:text-lg text-white leading-snug">
              Alta rentabilidad
            </p>
            <p className="text-xs text-white/65 font-jakarta leading-relaxed">
              Despachos asegurados a toda Colombia. Asesoría directa.
            </p>
          </div>
        </div>
        <h1 className="sr-only">Catálogo Mayorista — El momento de emprender es ahora</h1>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        {/* Barra superior (sticky). Buscando: pestañas con cuántas piezas
            encontró cada categoría. Dentro de una categoría: volver a la
            cuadrícula y su nombre. En la entrada: una invitación a elegir. */}
        <div className="sticky top-0 z-30 -mx-5 mb-10 border-b border-border glass px-5 py-3 md:mx-0 md:mt-6 md:rounded-full md:border md:px-4">
          <div className="flex items-center gap-3">
            {!query ? (
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {landing ? (
                  <p className="truncate pl-1 text-sm font-medium text-primary">
                    Elige una categoría
                  </p>
                ) : (
                  <>
                    <Link
                      href={base}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-white/70 hover:text-primary"
                    >
                      <ArrowLeft className="h-4 w-4" /> Categorías
                    </Link>
                    <span className="min-w-0 truncate font-prata text-lg text-primary">
                      {categoryName}
                    </span>
                    <span className="hidden shrink-0 text-xs text-secondary/70 sm:block">
                      {piezas(products.length)}
                    </span>
                  </>
                )}
              </div>
            ) : (
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
                    {t.count !== null && (
                      <span className={`ml-1.5 text-xs ${active ? "text-white/70" : "text-secondary/60"}`}>
                        {t.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            )}
            {query && (
              <span className="hidden shrink-0 pr-2 text-xs text-secondary/70 sm:block">
                {piezas(products.length)}
              </span>
            )}
            <WholesaleSearch base={base} categoria={categoria ?? ""} initialQuery={query} />
          </div>
        </div>

        {/* Grid. En balinería (sin búsqueda) va por secciones según el tipo
            de pieza: balín liso, diamantado, italiano, barriles... (ver
            groupBalines). Buscando se muestra la lista normal: los resultados
            ya son pocos y las secciones solo estorbarían. */}
        {landing ? (
          <WholesaleCategoryGrid tiles={tiles} base={base} />
        ) : products.length > 0 ? (
          (category === BALINES_CATEGORY && !query
            ? groupBalines(products)
            : [{ label: null as string | null, items: products }]
          ).map((seccion) => (
            <section key={seccion.label ?? "todas"} className={seccion.label ? "mb-16" : ""}>
              {seccion.label && (
                <h2 className="mb-6 flex items-baseline gap-3 border-b border-border pb-3 font-prata text-2xl text-primary">
                  {seccion.label}
                  <span className="font-sans text-xs text-secondary/60">
                    {seccion.items.length} {seccion.items.length === 1 ? "pieza" : "piezas"}
                  </span>
                </h2>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 pt-2 lg:grid-cols-4">
                {seccion.items.map((p, i) => (
                  <div
                    key={p.slug}
                    className="cascade"
                    style={{ "--i": i % 8 } as React.CSSProperties}
                  >
                    <WholesaleProductCard product={p} />
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="py-24 text-center text-secondary">
            <p>
              {query
                ? category !== "todos" && found.length > 0
                  ? `No hay piezas con “${query}” en esta categoría.`
                  : `No encontramos piezas con “${query}”. Prueba con otra palabra.`
                : "No hay piezas disponibles en esta categoría por ahora."}
            </p>
            {/* Solo pasa con un enlace viejo que combine búsqueda y categoría:
                las pestañas ya no dejan llegar aquí. */}
            {query && category !== "todos" && found.length > 0 && (
              <Link
                href={`${base}?q=${encodeURIComponent(query)}`}
                className="mt-4 inline-block text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                Ver las {found.length} {found.length === 1 ? "pieza" : "piezas"} en todas las categorías
              </Link>
            )}
          </div>
        )}

        {/* Pie neutro, sin marca. pb extra: la barra del pedido es fija y
            taparía las últimas líneas. */}
        <footer className="mt-20 border-t border-border pb-16 pt-8 text-center text-xs text-secondary/60">
          Catálogo privado · Los precios pueden cambiar sin aviso · Pedidos por WhatsApp
        </footer>
      </div>

      <WholesaleOrder />

      {/* Solo en balinería: cada vez que se entra a la categoría se recuerda la
          compra mínima. Buscar dentro de ella no lo vuelve a abrir, porque el
          componente sigue montado mientras la categoría no cambie. */}
      {category === BALINES_CATEGORY && <BalinesNoticeModal />}
    </div>
  );
}

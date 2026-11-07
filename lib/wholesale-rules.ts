// Reglas de venta del catálogo mayorista. Módulo puro (sin base de datos) para
// que lo puedan importar los componentes del navegador sin arrastrar Prisma.

import { normalizeText } from "@/lib/search-text";

export const BALINES_CATEGORY = "balineria-e-insumos";

// Se vende por lotes: menos de 12 balines de una referencia no se despacha.
export const BALINES_MIN_QTY = 12;

// Desde esta cantidad por referencia hay precio especial (se negocia por
// WhatsApp; no está cargado como precio en la base de datos).
export const BALINES_SPECIAL_QTY = 50;

export function minQtyFor(categorySlug: string): number {
  return categorySlug === BALINES_CATEGORY ? BALINES_MIN_QTY : 1;
}

// Precios por tramo de cantidad (balines lisos). Cada tramo vale desde `min`
// unidades de ESA referencia y toda la línea se cobra al precio del tramo en
// que cae la cantidad. Una pieza sin tramos sigue con su precio único de
// siempre (el de la base de datos).
export type PriceTier = { min: number; price: number };

// Cantidades donde empieza cada tramo: x12, x50, x100 y x500.
const BALINES_TIER_MINS = [12, 50, 100, 500];

// Precios por referencia, en el mismo orden que BALINES_TIER_MINS. Viven aquí y
// no en la base de datos (igual que las demás reglas de la balinería); para
// cambiarlos se edita esta tabla y se despliega.
const BALINES_TIER_PRICES: Record<string, number[]> = {
  BL3: [1800, 1500, 1300, 1100],
  BL4: [2500, 2100, 1900, 1700],
  BL5: [4300, 4000, 3800, 3500],
  BL6: [5200, 4900, 4600, 4400],
  BL8: [9500, 9300, 9000, 8800],
};

// Tramos de una referencia, o null si no tiene (precio único).
export function tiersForSlug(slug: string): PriceTier[] | null {
  const prices = BALINES_TIER_PRICES[slug];
  return prices ? prices.map((price, i) => ({ min: BALINES_TIER_MINS[i], price })) : null;
}

// Tramo que le toca a una cantidad: el de mayor `min` que no la supera. Por
// debajo del primer tramo (no debería pasar: el mínimo de venta es 12) se
// usa el primero.
export function tierFor(tiers: PriceTier[], qty: number): PriceTier {
  let found = tiers[0];
  for (const t of tiers) if (qty >= t.min) found = t;
  return found;
}

// Precio unitario de una línea del pedido. Sin tramos, el precio fijo.
export function unitPriceFor(item: { price: number; tiers?: PriceTier[] | null }, qty: number): number {
  return item.tiers?.length ? tierFor(item.tiers, qty).price : item.price;
}

// Etiqueta de cada tramo para mostrar: "12–49 und", "500+ und".
export function tierLabels(tiers: PriceTier[]): { label: string; min: number; price: number }[] {
  return tiers.map((t, i) => {
    const next = tiers[i + 1];
    return {
      min: t.min,
      price: t.price,
      label: next ? `${t.min}–${next.min - 1} und` : `${t.min}+ und`,
    };
  });
}

// Secciones de la categoría de balinería y cómo se reconoce cada una. El
// tipo sale del NOMBRE de la pieza (no hay columna para esto en la base de
// datos): se compara sin tildes ni mayúsculas y gana la PRIMERA regla que
// coincide. Por eso "italiana" va antes que "diamantado": los "Balin
// Diamantado Rosado (italy)" son italianos. "dimanat" cubre una pieza que
// está escrita así en la base de datos.
export const BALINES_SECTIONS: { label: string; matches: (name: string) => boolean }[] = [
  { label: "Balín liso", matches: (n) => /^balin lis[ao]\b/.test(n) },
  { label: "Balinería italiana", matches: (n) => n.includes("italian") || n.includes("italy") },
  { label: "Balín diamantado", matches: (n) => n.startsWith("balin") && /diamant|dimanat/.test(n) },
  { label: "Otros balines", matches: (n) => n.startsWith("balin") },
  { label: "Barriles", matches: (n) => n.startsWith("barril") },
  { label: "Canutillos", matches: (n) => n.startsWith("canutillo") },
  { label: "Rondeles", matches: (n) => n.startsWith("rondel") },
];

// Una pieza nueva que no encaje en ninguna regla no desaparece: va aquí.
export const BALINES_OTHER = "Otros";

// Orden en pantalla, distinto del de las reglas: "italiana" se revisa antes que
// "diamantado" para atrapar a los rosados italianos, pero se muestra después.
const BALINES_DISPLAY_ORDER = [
  "Balín liso",
  "Balín diamantado",
  "Balinería italiana",
  "Otros balines",
  "Barriles",
  "Canutillos",
  "Rondeles",
  BALINES_OTHER,
];

// Agrupa las piezas por sección (en el orden de BALINES_DISPLAY_ORDER, sin secciones
// vacías) y ordena cada sección por nombre con los números como números, así
// queda 3 mm, 4 mm, 5 mm... y no 3, 4, 18.
export function groupBalines<T extends { name: string }>(
  items: T[]
): { label: string; items: T[] }[] {
  const labels = BALINES_DISPLAY_ORDER;
  const groups = new Map<string, T[]>(labels.map((l) => [l, []]));
  for (const item of items) {
    const n = normalizeText(item.name);
    const label = BALINES_SECTIONS.find((s) => s.matches(n))?.label ?? BALINES_OTHER;
    groups.get(label)!.push(item);
  }
  return labels
    .map((label) => ({
      label,
      items: groups
        .get(label)!
        .sort((a, b) => a.name.localeCompare(b.name, "es", { numeric: true, sensitivity: "base" })),
    }))
    .filter((g) => g.items.length > 0);
}

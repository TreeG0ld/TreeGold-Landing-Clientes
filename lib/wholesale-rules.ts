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

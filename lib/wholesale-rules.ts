// Reglas de venta del catálogo mayorista. Módulo puro (sin base de datos) para
// que lo puedan importar los componentes del navegador sin arrastrar Prisma.

export const BALINES_CATEGORY = "balineria-e-insumos";

// Se vende por lotes: menos de 12 balines de una referencia no se despacha.
export const BALINES_MIN_QTY = 12;

// Desde esta cantidad por referencia hay precio especial (se negocia por
// WhatsApp; no está cargado como precio en la base de datos).
export const BALINES_SPECIAL_QTY = 50;

export function minQtyFor(categorySlug: string): number {
  return categorySlug === BALINES_CATEGORY ? BALINES_MIN_QTY : 1;
}

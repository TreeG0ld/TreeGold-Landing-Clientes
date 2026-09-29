import { site } from "./site";
import { formatCOP } from "./format";
import type { SelectionItem } from "./store";

// Los mensajes usan el formato nativo de WhatsApp: *texto* sale en negrita.

// Un bloque por pieza. La referencia (el código del producto, el mismo del
// panel /admin) va en su propia línea porque es con lo que el negocio ubica la
// pieza en bodega: con solo el nombre había que adivinar entre modelos
// parecidos.
function itemBlock(i: SelectionItem, idx: number): string {
  const lines = [`*${idx + 1}. ${i.name}*`, `   Ref: ${i.slug}`];
  if (i.size) lines.push(`   Talla: ${i.size}`);
  lines.push(`   ${i.qty} × ${formatCOP(i.price)} = *${formatCOP(i.price * i.qty)}*`);
  return lines.join("\n");
}

const SEPARATOR = "━━━━━━━━━━━━";

function piezas(items: SelectionItem[]): string {
  const n = items.reduce((acc, i) => acc + i.qty, 0);
  return `${n} ${n === 1 ? "pieza" : "piezas"}`;
}

function waLink(message: string): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

// Pedido desde la selección de la tienda pública.
export function buildSelectionLink(items: SelectionItem[], total: number): string {
  const message =
    `¡Hola ${site.fullName}! Quiero consultar por estos productos:\n\n` +
    items.map(itemBlock).join("\n\n") +
    `\n\n${SEPARATOR}\n` +
    `*Total estimado: ${formatCOP(total)}* (${piezas(items)})\n\n` +
    `¿Me confirman disponibilidad y forma de pago?`;

  return waLink(message);
}

// Consulta por un solo producto (botón "Consultar" de la ficha).
export function buildProductLink(name: string, price: number, slug?: string): string {
  const message =
    `¡Hola ${site.fullName}! Me interesa esta pieza:\n\n` +
    `*${name}*\n` +
    (slug ? `   Ref: ${slug}\n` : "") +
    `   Precio: ${formatCOP(price)}\n\n` +
    `¿Me das más información?`;
  return waLink(message);
}

// Pedido completo desde el catálogo mayorista. Mensaje neutro, sin mencionar
// la marca, porque esa página no lleva branding a propósito.
export function buildWholesaleSelectionLink(
  items: SelectionItem[],
  total: number
): string {
  const message =
    `Hola, quiero hacer este pedido del catálogo mayorista:\n\n` +
    items.map(itemBlock).join("\n\n") +
    `\n\n${SEPARATOR}\n` +
    `*Total: ${formatCOP(total)}* (${piezas(items)})\n\n` +
    `¿Me confirmas disponibilidad y cantidades mínimas?`;

  return waLink(message);
}

export function buildGeneralLink(text?: string): string {
  const message = text ?? `¡Hola ${site.fullName}! Quisiera más información.`;
  return waLink(message);
}

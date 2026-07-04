import { site } from "./site";
import { formatCOP } from "./format";
import type { SelectionItem } from "./store";

// Genera el enlace wa.me con el pedido prellenado.
export function buildSelectionLink(items: SelectionItem[], total: number): string {
  const lines = items.map((i, idx) => {
    const size = i.size ? ` — Talla ${i.size}` : "";
    return `${idx + 1}. ${i.name}${size} — x${i.qty} — ${formatCOP(
      i.price * i.qty
    )}`;
  });

  const message =
    `¡Hola ${site.fullName}! 👋 Quiero consultar por estos productos:\n\n` +
    lines.join("\n") +
    `\n\nTotal estimado: ${formatCOP(total)}\n` +
    `¿Me confirman disponibilidad y forma de pago?`;

  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

// Enlace para consultar un solo producto.
export function buildProductLink(name: string, price: number): string {
  const message =
    `¡Hola ${site.fullName}! 👋 Me interesa esta pieza:\n\n` +
    `• ${name} — ${formatCOP(price)}\n\n` +
    `¿Me das más información?`;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

// Enlace para pedidos desde el catálogo mayorista: mensaje neutro,
// sin mencionar la marca (la página de mayoristas no lleva branding).
export function buildWholesaleProductLink(name: string, price: number): string {
  const message =
    `Hola 👋 Quiero hacer un pedido del catálogo mayorista:\n\n` +
    `• ${name} — ${formatCOP(price)}\n\n` +
    `¿Me confirmas disponibilidad y cantidad mínima?`;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function buildGeneralLink(text?: string): string {
  const message = text ?? `¡Hola ${site.fullName}! 👋 Quisiera más información.`;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

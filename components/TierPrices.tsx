import { formatCOP } from "@/lib/format";
import { tierFor, tierLabels, type PriceTier } from "@/lib/wholesale-rules";

// Precios por tramo de cantidad de una referencia (balines lisos). Se marca en
// dorado el tramo que le toca a la cantidad del pedido; si la pieza aún no está
// en el pedido, el primero (el de la compra mínima), como en el catálogo de
// referencia. Así el distribuidor ve a qué precio le queda la compra y cuánto
// le falta para el siguiente.
export default function TierPrices({
  tiers,
  qty = 0,
  className = "",
}: {
  tiers: PriceTier[];
  qty?: number;
  className?: string;
}) {
  const activeMin = qty > 0 ? tierFor(tiers, qty).min : tiers[0].min;
  return (
    <ul className={`space-y-1.5 text-xs sm:text-sm ${className}`}>
      {tierLabels(tiers).map((t) => {
        const active = t.min === activeMin;
        return (
          <li
            key={t.min}
            className={`flex items-baseline justify-between gap-4 ${
              active ? "font-medium text-accent" : "text-secondary"
            }`}
          >
            <span>{t.label}</span>
            <span className="whitespace-nowrap tabular-nums">{formatCOP(t.price)}</span>
          </li>
        );
      })}
    </ul>
  );
}

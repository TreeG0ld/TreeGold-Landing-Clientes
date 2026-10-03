import { ShoppingBag } from "lucide-react";

// Ícono del estado vacío de la selección (panel lateral y página /seleccion):
// la misma bolsa del menú, dentro de un círculo dorado suave. Ícono y no
// emoji: los emojis se dibujan distinto en cada teléfono y desentonan con el
// resto de iconos del sitio.
export default function EmptyBagIcon() {
  return (
    <span
      aria-hidden="true"
      className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-accent"
    >
      <ShoppingBag className="h-9 w-9" strokeWidth={1.4} />
    </span>
  );
}

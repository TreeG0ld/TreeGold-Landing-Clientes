import { Truck } from "lucide-react";
import { formatCOP } from "@/lib/format";
import { site } from "@/lib/site";
import { shippingFor } from "@/lib/checkout";

// Aviso de envío gratis con una barra de progreso: cuánto falta para llegar a
// `site.freeShippingFrom`, o la confirmación de que ya es gratis. Usa la misma
// regla con la que se cobra (shippingFor), así nunca promete algo distinto.
export default function FreeShippingHint({ subtotal }: { subtotal: number }) {
  const gratis = shippingFor(subtotal, site) === 0;
  const falta = site.freeShippingFrom - subtotal;
  const avance = Math.min(100, Math.round((subtotal / site.freeShippingFrom) * 100));

  return (
    <div className="rounded-xl bg-accent/10 px-3.5 py-3 text-xs text-primary">
      <p className="flex items-center gap-2">
        <Truck className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} />
        {gratis ? (
          <span>
            <span className="font-semibold">¡Tu envío es gratis!</span> A toda Colombia.
          </span>
        ) : (
          <span>
            Te faltan <span className="font-semibold">{formatCOP(falta)}</span> para el envío gratis.
          </span>
        )}
      </p>
      <p className="mt-1 pl-6 text-[0.7rem] text-secondary">{site.deliveryNote}</p>
      <div
        className="mt-2 h-1 overflow-hidden rounded-full bg-accent/15"
        role="progressbar"
        aria-label="Avance hacia el envío gratis"
        aria-valuenow={avance}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${avance}%` }}
        />
      </div>
    </div>
  );
}

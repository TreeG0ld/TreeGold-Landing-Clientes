import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Botón "Ver todas las promociones" de la portada, bajo la vitrina de ofertas.
// Pastilla en rojo vino (el mismo rojo de los porcentajes de descuento de las
// tarjetas) con la etiqueta de promoción, el texto en dos líneas y la flecha
// en un círculo. Al pasar el mouse se levanta, la etiqueta se mece, la flecha
// avanza y la cruza un brillo, como luz sobre una joya.
//
// public/promo-tag.webp: la etiqueta 3D que eligió el dueño, con el fondo de
// cuadritos (venía pintado en la imagen, sin transparencia real) quitado y
// reducida a 120 px.
export default function PromoCta({ total }: { total: number }) {
  return (
    <Link
      href="/promociones"
      aria-label={`Ver todas las promociones (${total})`}
      className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-[#5c0f17] via-[#8e1622] to-[#b8232e] py-1.5 pl-3 pr-1.5 text-left text-white shadow-[0_12px_28px_-12px_rgba(142,22,34,0.7)] ring-1 ring-inset ring-white/15 transition-all duration-500 ease-luxe hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-14px_rgba(142,22,34,0.85)] active:translate-y-0"
    >
      {/* Brillo que cruza el botón al pasar el mouse. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-luxe group-hover:translate-x-[420%]"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/promo-tag.webp"
        alt=""
        width={40}
        height={40}
        decoding="async"
        className="relative h-10 w-10 shrink-0 drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)] transition-transform duration-500 ease-luxe group-hover:-rotate-12 group-hover:scale-110"
      />

      <span className="relative flex flex-col leading-tight">
        <span className="text-[11px] text-white/75">Ver todas las</span>
        <span className="flex items-center gap-1.5 text-base font-semibold tracking-wide">
          promociones
          <span className="rounded-full bg-white/15 px-1.5 text-[10px] font-medium leading-4 tabular-nums text-white/90">
            {total}
          </span>
        </span>
      </span>

      <span
        aria-hidden
        className="relative ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-inset ring-white/20 transition-colors duration-300 group-hover:bg-white/25"
      >
        <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-luxe group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { isAdminPhoto, squarePhotoLoader } from "@/lib/imageLoader";
import type { WholesaleCategoryTile } from "@/lib/wholesale";

// Entrada del catálogo mayorista: una cuadrícula de categorías con foto en vez
// de la barra horizontal de pestañas, que en celular obligaba a deslizar para
// encontrar la categoría. Cada cuadro abre esa categoría; el último, todo el
// catálogo. Es componente de cliente solo por el `loader` de la foto (una
// función no se puede pasar desde un componente de servidor).
export default function WholesaleCategoryGrid({
  tiles,
  base,
}: {
  tiles: WholesaleCategoryTile[];
  /** Ruta del catálogo, p. ej. "/mayoristas-<código>". */
  base: string;
}) {
  const total = tiles.reduce((n, t) => n + t.count, 0);
  const piezas = (n: number) => `${n} ${n === 1 ? "pieza" : "piezas"}`;

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 pt-2 md:grid-cols-3 lg:grid-cols-4">
      {tiles.map((t, i) => (
        <Link
          key={t.slug}
          href={`${base}?categoria=${t.slug}`}
          className="cascade group block"
          style={{ "--i": i % 8 } as React.CSSProperties}
        >
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
            {t.image && (
              <Image
                loader={squarePhotoLoader}
                src={t.image}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`${
                  isAdminPhoto(t.image) ? "object-cover" : "object-contain p-4"
                } transition-transform duration-500 ease-luxe group-hover:scale-105`}
              />
            )}
          </div>
          <div className="mt-3 flex items-start justify-between gap-2 px-1">
            <div className="min-w-0">
              <h2 className="truncate font-serif text-base leading-tight text-primary transition-colors group-hover:text-accent sm:text-lg">
                {t.name}
              </h2>
              <p className="mt-0.5 text-xs text-secondary/70">{piezas(t.count)}</p>
            </div>
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-secondary/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent" />
          </div>
        </Link>
      ))}

      {/* Para quien prefiere recorrer todo el catálogo de una vez. */}
      <Link
        href={`${base}?categoria=todos`}
        className="cascade group block"
        style={{ "--i": tiles.length % 8 } as React.CSSProperties}
      >
        <div className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl bg-primary text-white transition-colors group-hover:bg-primary/90">
          <LayoutGrid className="h-8 w-8 text-accent-soft" strokeWidth={1.5} />
          <span className="font-serif text-xl">Ver todo</span>
        </div>
        <div className="mt-3 flex items-start justify-between gap-2 px-1">
          <div className="min-w-0">
            <h2 className="truncate font-serif text-base leading-tight text-primary transition-colors group-hover:text-accent sm:text-lg">
              Todas las categorías
            </h2>
            <p className="mt-0.5 text-xs text-secondary/70">{piezas(total)}</p>
          </div>
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-secondary/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent" />
        </div>
      </Link>
    </div>
  );
}

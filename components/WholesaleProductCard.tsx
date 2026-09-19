"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Plus } from "lucide-react";
import { formatCOP } from "@/lib/format";
import { useWholesaleSelection } from "@/lib/store";
import type { WholesaleProduct } from "@/lib/wholesale";

// Tarjeta simple para el catálogo de mayoristas: NO enlaza a /producto/[slug]
// (esa ruta pública muestra el precio de venta al detal, no el de costo).
export default function WholesaleProductCard({ product }: { product: WholesaleProduct }) {
  const add = useWholesaleSelection((s) => s.add);
  const [added, setAdded] = useState(false);

  // Sin tope de clics seguidos, al revés que en la tienda pública: un
  // distribuidor pide por cantidad y necesita sumar unidades rápido.
  const handleAdd = () => {
    add({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-4"
        />
      </div>
      <div className="mt-4 px-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="min-w-0 truncate font-serif text-sm leading-tight pr-1 sm:text-base">
            {product.name}
          </h3>
          <div className="shrink-0 text-right">
            <span className="block whitespace-nowrap text-xs font-medium text-secondary sm:text-sm">
              {formatCOP(product.price)}
            </span>
            <span className="block whitespace-nowrap text-[0.65rem] text-secondary/60 sm:text-xs">
              Sugerido: {formatCOP(product.retailPrice)}
            </span>
          </div>
        </div>
        <p className="mt-1 text-xs uppercase tracking-wide text-secondary/60">
          {[product.categoryName, product.material].filter(Boolean).join(" · ")}
        </p>
        <button
          onClick={handleAdd}
          aria-label={`Agregar ${product.name} al pedido`}
          className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300 cursor-pointer ${
            added
              ? "border-accent bg-accent/10 text-accent"
              : "border-border text-primary hover:border-accent hover:text-accent"
          }`}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" /> Agregado
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Agregar al pedido
            </>
          )}
        </button>
      </div>
    </div>
  );
}

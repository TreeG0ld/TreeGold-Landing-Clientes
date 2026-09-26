"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Plus } from "lucide-react";
import { formatCOP } from "@/lib/format";
import { useWholesaleSelection } from "@/lib/store";
import WholesaleProductModal from "@/components/WholesaleProductModal";
import type { WholesaleProduct } from "@/lib/wholesale";

// Tarjeta del catálogo de mayoristas. Al tocarla NO navega a /producto/[slug]
// (esa ruta pública muestra el precio de venta al detal): abre una ventana con
// la vista ampliada dentro del mismo catálogo.
export default function WholesaleProductCard({ product }: { product: WholesaleProduct }) {
  const add = useWholesaleSelection((s) => s.add);
  const [added, setAdded] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);

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
      <button
        type="button"
        onClick={() => setOpenDetail(true)}
        aria-label={`Ver ${product.name} en detalle`}
        className="relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-white cursor-pointer"
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-4 transition-transform duration-500 ease-luxe group-hover:scale-105"
        />
      </button>
      <div className="mt-4 px-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3
            onClick={() => setOpenDetail(true)}
            className="min-w-0 truncate font-serif text-sm leading-tight pr-1 transition-colors hover:text-accent sm:text-base cursor-pointer"
          >
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
        {/* La medida va aquí porque es lo que distingue dos referencias del
            mismo modelo: sin ella el distribuidor no sabe qué está pidiendo. */}
        <p className="mt-1 text-xs uppercase tracking-wide text-secondary/60">
          {/* `Set` quita repetidos: en muchas piezas la categoría y el material
              son el mismo texto ("Plata ley 925") y salía dos veces. */}
          {[
            ...new Set(
              [product.categoryName, product.material, product.size].filter(Boolean)
            ),
          ].join(" · ")}
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

      {openDetail && (
        <WholesaleProductModal
          product={product}
          onClose={() => setOpenDetail(false)}
        />
      )}
    </div>
  );
}

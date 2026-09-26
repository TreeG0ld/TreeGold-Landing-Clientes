"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Check } from "lucide-react";
import { formatCOP } from "@/lib/format";
import { useWholesaleSelection } from "@/lib/store";
import type { WholesaleProduct } from "@/lib/wholesale";
import { lockScroll } from "@/lib/scroll-lock";

// Vista ampliada de una pieza del catálogo mayorista. Es una ventana dentro de
// la misma página y NO un enlace a /producto/[slug] a propósito: esa ruta es la
// ficha pública, muestra el precio de venta al detal y sacaría al distribuidor
// del catálogo de costos.
export default function WholesaleProductModal({
  product,
  onClose,
}: {
  product: WholesaleProduct;
  onClose: () => void;
}) {
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState(false);
  const add = useWholesaleSelection((s) => s.add);

  useEffect(() => lockScroll(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleAdd() {
    add({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  // Se omite el material cuando repite la categoría: en muchas piezas ambos
  // dicen lo mismo ("Plata ley 925") y quedaba una fila duplicada.
  const detalles = [
    ["Categoría", product.categoryName],
    ["Material", product.material === product.categoryName ? "" : product.material],
    ["Medida", product.size],
  ].filter(([, v]) => v);

  // Se dibuja en <body> y no donde vive la tarjeta: las tarjetas entran con una
  // animación que usa `transform`, y un ancestro con transform se convierte en
  // el marco de referencia de los elementos `fixed`. Sin esto, la ventana
  // quedaba anclada DENTRO de la tarjeta —pequeña y recortada— en vez de ocupar
  // la pantalla.
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        // z-[70]: por encima del panel del pedido (z-61) para que se pueda
        // abrir una pieza con el pedido abierto.
        className="fixed inset-0 z-[70] flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative flex max-h-full w-full max-w-4xl flex-col overflow-y-auto rounded-3xl bg-background shadow-2xl md:flex-row"
        >
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-primary backdrop-blur transition-colors hover:text-accent cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Galería */}
          <div className="md:w-1/2 md:shrink-0">
            <div className="relative aspect-square w-full bg-white">
              <Image
                src={product.images[active]}
                alt={`${product.name} — vista ${active + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-4"
              />
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {product.images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setActive(i)}
                    aria-label={`Ver imagen ${i + 1}`}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white transition-all duration-300 cursor-pointer ${
                      active === i ? "ring-2 ring-accent" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt="" fill sizes="64px" className="object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Datos */}
          <div className="flex flex-1 flex-col p-6 md:p-8">
            <h2 className="font-serif text-2xl leading-tight text-primary md:text-3xl">
              {product.name}
            </h2>

            <div className="mt-5 rounded-2xl border border-border p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-secondary">Tu costo</span>
                <span className="font-serif text-3xl text-accent">
                  {formatCOP(product.price)}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <span className="text-xs text-secondary/70">Precio sugerido de venta</span>
                <span className="text-sm text-secondary">
                  {formatCOP(product.retailPrice)}
                </span>
              </div>
            </div>

            {detalles.length > 0 && (
              <dl className="mt-6 space-y-2.5">
                {detalles.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 text-sm">
                    <dt className="text-secondary/70">{k}</dt>
                    <dd className="text-right text-primary">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {product.description && (
              <p className="mt-5 text-sm leading-relaxed text-secondary">
                {product.description}
              </p>
            )}

            <button
              onClick={handleAdd}
              className={`btn-primary mt-8 w-full md:mt-auto ${added ? "bg-accent" : ""}`}
            >
              {added ? (
                <>
                  <Check className="h-5 w-5" /> Agregado
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" /> Agregar al pedido
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

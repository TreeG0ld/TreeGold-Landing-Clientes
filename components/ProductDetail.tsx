"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Check, ShoppingBag, ChevronLeft } from "lucide-react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { useSelection } from "@/lib/store";
import { formatCOP } from "@/lib/format";
import { buildProductLink } from "@/lib/whatsapp";
import { flyToCart } from "@/lib/flyToCart";

export default function ProductDetail({ product }: { product: Product }) {
  const add = useSelection((s) => s.add);
  const [active, setActive] = useState(0);
  const [size, setSize] = useState(product.sizes?.[0]);
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    flyToCart(r.left + r.width / 2, r.top + r.height / 2, product.images[active]);
    add({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0],
      size,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-24 md:px-8 md:pt-32">
      <Link
        href="/coleccion"
        className="mb-6 inline-flex items-center gap-1 text-sm text-secondary transition-colors hover:text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> Volver a la colección
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Galería */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={product.images[active]}
                  alt={`${product.name} — vista ${active + 1}`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-6"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActive(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  className={`relative h-20 w-20 overflow-hidden rounded-xl transition-all duration-300 cursor-pointer ${
                    active === i
                      ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:pt-6">
          <p className="eyebrow mb-3">
            {[product.material, product.size].filter(Boolean).join(" · ")}
          </p>
          <h1 className="text-4xl md:text-5xl">{product.name}</h1>
          <p className="mt-4 font-serif text-3xl text-accent">
            {formatCOP(product.price)}
          </p>
          <p className="mt-2 text-xs text-secondary/60">
            Precio referencial · confirmamos por WhatsApp
          </p>

          <p className="mt-6 leading-relaxed text-secondary">
            {product.description}
          </p>

          {product.sizes && (
            <div className="mt-8">
              <p className="mb-3 text-sm font-medium">Talla</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`h-11 min-w-11 rounded-full border px-4 text-sm font-medium transition-all duration-300 cursor-pointer ${
                      size === s
                        ? "border-primary bg-primary text-white"
                        : "border-border text-secondary hover:border-accent hover:text-accent"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleAdd}
              className="btn-primary flex-1"
              aria-label="Agregar a mi selección"
            >
              {added ? (
                <>
                  <Check className="h-5 w-5" /> Agregado
                </>
              ) : (
                <>
                  <ShoppingBag className="h-5 w-5" /> Agregar a selección
                </>
              )}
            </button>
            <a
              href={buildProductLink(product.name, product.price)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#25D366] px-7 py-3.5 text-sm font-medium text-[#1c8a47] transition-all duration-300 ease-luxe hover:bg-[#25D366]/10 active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-5 w-5" /> Consultar
            </a>
          </div>

          {/* Detalles */}
          <div className="mt-10 border-t border-border pt-8">
            <h2 className="mb-4 font-serif text-2xl">Detalles</h2>
            <ul className="space-y-2.5">
              {product.details.map((d) => (
                <li key={d} className="flex items-center gap-3 text-sm text-secondary">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

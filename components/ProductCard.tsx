"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/products";
import { useSelection } from "@/lib/store";
import { formatCOP } from "@/lib/format";
import { flyToCart } from "@/lib/flyToCart";

export default function ProductCard({ product }: { product: Product }) {
  const add = useSelection((s) => s.add);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    flyToCart(r.left + r.width / 2, r.top + r.height / 2, product.images[0]);
    add({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0],
      size: product.sizes?.[0],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
      className="group"
    >
      <Link href={`/producto/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-4 transition-transform duration-700 ease-luxe group-hover:scale-105"
          />
          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {product.gemstone && (
            <span className="absolute left-3 top-3 rounded-full glass px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wide text-primary">
              {product.gemstone}
            </span>
          )}

          {/* Add button reveal */}
          <button
            onClick={handleAdd}
            aria-label={`Agregar ${product.name} a mi selección`}
            className="absolute bottom-3 right-3 flex h-11 w-11 translate-y-3 items-center justify-center rounded-full bg-primary text-on-primary opacity-0 shadow-lg transition-all duration-400 ease-luxe hover:bg-accent group-hover:translate-y-0 group-hover:opacity-100 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 px-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-serif text-xl leading-tight transition-colors duration-300 group-hover:text-accent">
              {product.name}
            </h3>
            <span className="shrink-0 text-sm font-medium text-secondary">
              {formatCOP(product.price)}
            </span>
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-secondary/60">
            {[product.material, product.size].filter(Boolean).join(" · ")}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

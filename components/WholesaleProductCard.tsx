"use client";

import Image from "next/image";
import { formatCOP } from "@/lib/format";
import { buildProductLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import type { WholesaleProduct } from "@/lib/wholesale";

// Tarjeta simple para el catálogo de mayoristas: NO enlaza a /producto/[slug]
// (esa ruta pública muestra el precio de venta al detal, no el de costo).
export default function WholesaleProductCard({ product }: { product: WholesaleProduct }) {
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
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif text-xl leading-tight">{product.name}</h3>
          <span className="shrink-0 text-sm font-medium text-secondary">
            {formatCOP(product.price)}
          </span>
        </div>
        <p className="mt-1 text-xs uppercase tracking-wide text-secondary/60">
          {[product.categoryName, product.material].filter(Boolean).join(" · ")}
        </p>
        <a
          href={buildProductLink(product.name, product.price)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#25D366] px-4 py-2 text-xs font-medium text-[#1c8a47] transition-all duration-300 hover:bg-[#25D366]/10"
        >
          <WhatsAppIcon className="h-4 w-4" /> Pedir por WhatsApp
        </a>
      </div>
    </div>
  );
}

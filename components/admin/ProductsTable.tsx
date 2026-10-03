"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatCOP } from "@/lib/format";
import ScrollFadeBox from "@/components/admin/ScrollFadeBox";

type Row = {
  id: string;
  slug: string;
  name: string;
  retailPrice: number;
  stock: number;
  isRetail: boolean;
  isWholesale: boolean;
  images: string[];
  category: { name: string };
};

export default function ProductsTable({ products }: { products: Row[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Error al eliminar.");
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  if (products.length === 0) {
    return <p className="py-12 text-center text-secondary">No hay productos que coincidan.</p>;
  }

  // Alto máximo con scroll propio: con cientos de productos la tabla estiraba
  // toda la página. El cálculo deja a la vista el título, el buscador y la
  // paginación sin que la página haga scroll. Los títulos de columna quedan
  // fijos arriba (sticky): fondo opaco y la línea inferior como sombra,
  // porque un borde de tabla colapsada no viaja con el encabezado.
  return (
    <ScrollFadeBox className="max-h-[calc(100dvh-21rem)] min-h-72 overflow-auto rounded-2xl border border-border bg-white">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-secondary">
          <tr>
            <th className="sticky top-0 z-10 bg-[#f7f6f4] px-4 py-3 shadow-[inset_0_-1px_0_rgb(var(--color-border))]">Producto</th>
            <th className="sticky top-0 z-10 bg-[#f7f6f4] px-4 py-3 shadow-[inset_0_-1px_0_rgb(var(--color-border))]">Categoría</th>
            <th className="sticky top-0 z-10 bg-[#f7f6f4] px-4 py-3 shadow-[inset_0_-1px_0_rgb(var(--color-border))]">Precio</th>
            <th className="sticky top-0 z-10 bg-[#f7f6f4] px-4 py-3 shadow-[inset_0_-1px_0_rgb(var(--color-border))]">Stock</th>
            <th className="sticky top-0 z-10 bg-[#f7f6f4] px-4 py-3 shadow-[inset_0_-1px_0_rgb(var(--color-border))]">Visibilidad</th>
            <th className="sticky top-0 z-10 bg-[#f7f6f4] px-4 py-3 shadow-[inset_0_-1px_0_rgb(var(--color-border))]" />
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr
              key={p.id}
              // Solo fundido: el desplazamiento de .cascade hacía parpadear el
              // scroll de este recuadro.
              className="cascade cascade-fade border-b border-border last:border-0"
              style={{ "--i": Math.min(i, 14) } as React.CSSProperties}
            >
              <td className="flex items-center gap-3 px-4 py-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {p.images[0] && (
                    <Image src={p.images[0]} alt="" fill sizes="40px" className="object-contain p-0.5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-primary">{p.name}</p>
                  <p className="text-xs text-secondary/70">{p.slug}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-secondary">{p.category.name}</td>
              <td className="px-4 py-3 text-secondary">{formatCOP(p.retailPrice)}</td>
              <td className="px-4 py-3 text-secondary">{p.stock}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  {p.isRetail && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Retail</span>
                  )}
                  {p.isWholesale && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">Mayorista</span>
                  )}
                  {/* Ni detal ni mayorista = "Ocultar producto" en el formulario. */}
                  {!p.isRetail && !p.isWholesale && (
                    <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-secondary">
                      Oculto
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/productos/${p.id}`}
                    aria-label="Editar"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-muted hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={deletingId === p.id}
                    aria-label="Eliminar"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollFadeBox>
  );
}

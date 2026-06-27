"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatCOP } from "@/lib/format";

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

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-secondary">
          <tr>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Precio</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Visibilidad</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-border last:border-0">
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
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
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

type Shops = { isRetail: boolean; isWholesale: boolean };

// `returnQuery`: filtros y página del listado (q, categoria, page). Va en el
// enlace de editar para que, al guardar, el formulario vuelva a esta misma
// página y no al principio del listado.
export default function ProductsTable({
  products,
  returnQuery = "",
}: {
  products: Row[];
  returnQuery?: string;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  // Estado de tiendas cambiado desde aquí: se pinta al instante y no hace
  // falta recargar el listado (recargarlo devolvía el scroll al principio).
  const [shops, setShops] = useState<Record<string, Shops>>({});
  // Tiendas que tenía antes de ocultarlo, para devolvérselas tal cual al
  // volver a mostrarlo. Sin rastro (ya venía oculto): solo la tienda pública,
  // igual que la casilla "Ocultar producto" del formulario.
  const previas = useRef<Record<string, Shops>>({});

  const toggleVisible = async (p: Row) => {
    const actual = shops[p.id] ?? { isRetail: p.isRetail, isWholesale: p.isWholesale };
    const oculto = !actual.isRetail && !actual.isWholesale;
    const siguiente: Shops = oculto
      ? previas.current[p.id] ?? { isRetail: true, isWholesale: false }
      : { isRetail: false, isWholesale: false };

    setTogglingId(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siguiente),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "No se pudo cambiar la visibilidad.");
        return;
      }
      if (!oculto) previas.current[p.id] = actual;
      setShops((s) => ({ ...s, [p.id]: siguiente }));
    } catch {
      alert("Error de conexión. Intenta de nuevo.");
    } finally {
      setTogglingId(null);
    }
  };

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
    <ScrollFadeBox className="max-h-[calc(100dvh-21rem)] min-h-72 overflow-auto rounded-2xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-secondary">
          <tr>
            <th className="sticky top-0 z-10 bg-surface-alt px-4 py-3 shadow-[inset_0_-1px_0_rgb(var(--color-border))]">Producto</th>
            <th className="sticky top-0 z-10 bg-surface-alt px-4 py-3 shadow-[inset_0_-1px_0_rgb(var(--color-border))]">Categoría</th>
            <th className="sticky top-0 z-10 bg-surface-alt px-4 py-3 shadow-[inset_0_-1px_0_rgb(var(--color-border))]">Precio</th>
            <th className="sticky top-0 z-10 bg-surface-alt px-4 py-3 shadow-[inset_0_-1px_0_rgb(var(--color-border))]">Stock</th>
            <th className="sticky top-0 z-10 bg-surface-alt px-4 py-3 shadow-[inset_0_-1px_0_rgb(var(--color-border))]">Visibilidad</th>
            <th className="sticky top-0 z-10 bg-surface-alt px-4 py-3 shadow-[inset_0_-1px_0_rgb(var(--color-border))]" />
          </tr>
        </thead>
        <tbody>
          {products.map((row, i) => {
            const p = { ...row, ...shops[row.id] };
            const oculto = !p.isRetail && !p.isWholesale;
            return (
            <tr
              key={p.id}
              // Solo fundido: el desplazamiento de .cascade hacía parpadear el
              // scroll de este recuadro.
              className={`cascade cascade-fade border-b border-border last:border-0 ${oculto ? "opacity-60" : ""}`}
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
                  <button
                    onClick={() => toggleVisible(row)}
                    disabled={togglingId === p.id}
                    aria-label={oculto ? "Mostrar producto" : "Ocultar producto"}
                    title={oculto ? "Mostrar producto" : "Ocultar producto"}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-muted hover:text-primary disabled:opacity-50 cursor-pointer"
                  >
                    {oculto ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <Link
                    href={`/admin/productos/${p.id}${returnQuery ? `?volver=${encodeURIComponent(returnQuery)}` : ""}`}
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
            );
          })}
        </tbody>
      </table>
    </ScrollFadeBox>
  );
}

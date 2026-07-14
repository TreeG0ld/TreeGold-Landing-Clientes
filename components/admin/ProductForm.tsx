"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/admin/ImageUploader";

export type CategoryOption = { id: string; name: string; slug: string };

export type ProductFormValues = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  retailPrice: string;
  wholesalePrice: string;
  stock: string;
  material: string;
  size: string;
  images: string[];
  isRetail: boolean;
  isWholesale: boolean;
  isPromo: boolean;
  originalPrice: string;
};

const EMPTY: ProductFormValues = {
  slug: "",
  name: "",
  description: "",
  categoryId: "",
  retailPrice: "",
  wholesalePrice: "",
  stock: "0",
  material: "",
  size: "",
  images: [],
  isRetail: true,
  isWholesale: false,
  isPromo: false,
  originalPrice: "",
};

export default function ProductForm({
  categories,
  initialValues,
}: {
  categories: CategoryOption[];
  initialValues?: ProductFormValues;
}) {
  const router = useRouter();
  const isEdit = Boolean(initialValues?.id);
  const [values, setValues] = useState<ProductFormValues>(
    initialValues ?? { ...EMPTY, categoryId: categories[0]?.id ?? "" }
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const url = isEdit ? `/api/admin/products/${initialValues!.id}` : "/api/admin/products";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al guardar.");
        return;
      }
      router.push("/admin/productos");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">Código (slug)</label>
          <input
            value={values.slug}
            onChange={(e) => set("slug", e.target.value)}
            required
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">Nombre</label>
          <input
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            required
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-primary">Descripción</label>
        <textarea
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">Categoría</label>
          <select
            value={values.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            required
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-accent"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">Stock</label>
          <input
            type="number"
            value={values.stock}
            onChange={(e) => set("stock", e.target.value)}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">
            Precio de costo (wholesale)
          </label>
          <input
            type="number"
            value={values.wholesalePrice}
            onChange={(e) => set("wholesalePrice", e.target.value)}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">
            Precio de venta (retail)
          </label>
          <input
            type="number"
            value={values.retailPrice}
            onChange={(e) => set("retailPrice", e.target.value)}
            required
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">
            Precio anterior (originalPrice - para promos)
          </label>
          <input
            type="number"
            value={values.originalPrice}
            onChange={(e) => set("originalPrice", e.target.value)}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">Material</label>
          <input
            value={values.material}
            onChange={(e) => set("material", e.target.value)}
            placeholder="Oro laminado, Plata 925..."
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-primary">Medida / talla</label>
          <input
            value={values.size}
            onChange={(e) => set("size", e.target.value)}
            placeholder="Talla 7, 8, 9 / 45 cm..."
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-primary">
          <input
            type="checkbox"
            checked={values.isRetail}
            onChange={(e) => set("isRetail", e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-accent"
          />
          Visible en tienda pública
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-primary">
          <input
            type="checkbox"
            checked={values.isWholesale}
            onChange={(e) => set("isWholesale", e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-accent"
          />
          Visible en mayoristas
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-primary">
          <input
            type="checkbox"
            checked={values.isPromo}
            onChange={(e) => set("isPromo", e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-accent"
          />
          En promoción (aparece en la home)
        </label>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-primary">Imágenes</label>
        <ImageUploader
          images={values.images}
          onChange={(images) => set("images", images)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
        </button>
        <button type="button" onClick={() => router.push("/admin/productos")} className="btn-outline">
          Cancelar
        </button>
      </div>
    </form>
  );
}

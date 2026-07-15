"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/admin/ImageUploader";
import GlassSelect from "@/components/admin/GlassSelect";

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

// Tallas/medidas estándar según la categoría (por slug). Las categorías que
// no aparecen aquí (aretes, candongas, topos, dijes, herrajes, set…) son de
// talla única. La opción "Otra…" abre un campo libre: los productos antiguos
// tienen valores como "Talla 7, 8, 9" que no están en estas listas y no se
// deben perder al editarlos.
const RING_SIZES = [
  "Talla 4", "Talla 5", "Talla 6", "Talla 7", "Talla 8",
  "Talla 9", "Talla 10", "Talla 11", "Talla 12",
  "Talla graduable (ajustable)",
];
const BRACELET_SIZES = ["16 cm", "17 cm", "18 cm", "19 cm", "20 cm", "Graduable (ajustable)"];

const SIZE_OPTIONS_BY_CATEGORY: Record<string, string[]> = {
  "anillos": RING_SIZES,
  "anillos-tejidos": RING_SIZES,
  "cadenas-mujer": ["40 cm", "45 cm", "50 cm"],
  "cadenas-hombre": ["55 cm", "60 cm", "65 cm", "70 cm"],
  "pulseras": BRACELET_SIZES,
  "manillas-tejidas": BRACELET_SIZES,
  "tobilleras": ["22 cm", "24 cm", "25 cm", "Graduable (ajustable)"],
  "rosarios": ["50 cm", "55 cm", "60 cm"],
};

const SINGLE_SIZE = "Talla única";
// Valor centinela del <option> "Otra…" (nunca se guarda como talla).
const CUSTOM_SIZE = "__otra__";

function sizeOptionsFor(categorySlug: string): string[] {
  return SIZE_OPTIONS_BY_CATEGORY[categorySlug] ?? [SINGLE_SIZE];
}

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

  const categorySlug =
    categories.find((c) => c.id === values.categoryId)?.slug ?? "";
  const sizeOptions = sizeOptionsFor(categorySlug);

  // "Otra…": modo texto libre para tallas que no están en la lista estándar
  // (arranca activo si el producto que se edita trae un valor legado).
  const [customSize, setCustomSize] = useState<boolean>(() => {
    const init = initialValues ?? EMPTY;
    const slug =
      categories.find((c) => c.id === (init.categoryId || categories[0]?.id))?.slug ?? "";
    return Boolean(init.size) && !sizeOptionsFor(slug).includes(init.size);
  });

  // Al cambiar de categoría se limpia la talla si ya no aplica: las opciones
  // son distintas por categoría y una talla de anillo no tiene sentido en
  // una cadena.
  const handleCategoryChange = (categoryId: string) => {
    const slug = categories.find((c) => c.id === categoryId)?.slug ?? "";
    const opts = sizeOptionsFor(slug);
    setCustomSize(false);
    setValues((v) => ({
      ...v,
      categoryId,
      size:
        opts.length === 1 && opts[0] === SINGLE_SIZE
          ? SINGLE_SIZE
          : opts.includes(v.size)
            ? v.size
            : "",
    }));
  };

  const handleSizeSelect = (value: string) => {
    if (value === CUSTOM_SIZE) {
      setCustomSize(true);
      set("size", "");
    } else {
      setCustomSize(false);
      set("size", value);
    }
  };

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
          <GlassSelect
            value={values.categoryId}
            onChange={handleCategoryChange}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
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
            Precio para Mayoristas
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
            Precio de venta (tienda pública)
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
          <GlassSelect
            value={customSize ? CUSTOM_SIZE : values.size}
            onChange={handleSizeSelect}
            placeholder="Selecciona una medida…"
            options={[
              ...sizeOptions.map((o) => ({ value: o, label: o })),
              { value: CUSTOM_SIZE, label: "Otra…" },
            ]}
          />
          {customSize && (
            <input
              value={values.size}
              onChange={(e) => set("size", e.target.value)}
              placeholder='Ej: "Talla 7, 8, 9" o "48 cm"'
              autoFocus
              className="mt-2 w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          )}
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
            onChange={(e) =>
              // Al quitar la promo se limpia el precio anterior para no
              // guardar un descuento huérfano.
              setValues((v) => ({
                ...v,
                isPromo: e.target.checked,
                originalPrice: e.target.checked ? v.originalPrice : "",
              }))
            }
            className="h-4 w-4 cursor-pointer accent-accent"
          />
          En promoción (aparece en la home)
        </label>
      </div>

      {values.isPromo && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary">
              Precio anterior (para mostrar el descuento)
            </label>
            <input
              type="number"
              value={values.originalPrice}
              onChange={(e) => set("originalPrice", e.target.value)}
              placeholder="Precio antes de la promoción"
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>
      )}

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

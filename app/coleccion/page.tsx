import { Suspense } from "react";
import type { Metadata } from "next";
import CatalogClient from "@/components/CatalogClient";
import { getAllProducts, getAllCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Colección",
  description:
    "Explora la colección completa de Joyería TreeGold: anillos, collares, aretes y pulseras en oro 18k y plata 925.",
  alternates: { canonical: "/coleccion" },
};

// Regenera la página estática cada hora.
export const revalidate = 3600;

export default async function ColeccionPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
      <header className="mb-8 text-center">
        <p className="eyebrow mb-3">La colección</p>
        <h1 className="text-5xl md:text-6xl">Joyas TreeGold</h1>
        <p className="mx-auto mt-4 max-w-md text-secondary">
          Piezas únicas hechas a mano. Guarda tus favoritas y finaliza tu pedido
          por WhatsApp.
        </p>
      </header>

      <Suspense fallback={<div className="py-20 text-center text-secondary">Cargando…</div>}>
        <CatalogClient products={products} categories={categories} />
      </Suspense>
    </div>
  );
}

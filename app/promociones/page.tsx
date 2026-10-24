import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getPromos } from "@/lib/catalog";

// Todas las joyas en promoción. La home solo muestra las 8 editadas más
// recientemente y enlaza aquí con "Ver todas las promociones".
// Se regenera junto con el resto del catálogo (mismo patrón que la home).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Promociones",
  description:
    "Joyas en oro laminado y plata 925 con descuento por tiempo limitado: anillos, cadenas, dijes y pulseras de Joyería TreeGold.",
  alternates: { canonical: "/promociones" },
};

export default async function PromocionesPage() {
  const promos = await getPromos();

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
      <header className="mb-12 text-center">
        <p className="eyebrow mb-3">Por tiempo limitado</p>
        <h1 className="text-5xl md:text-6xl">Promociones</h1>
        <p className="mx-auto mt-4 max-w-md text-secondary">
          {promos.length === 1 ? "1 pieza con descuento" : `${promos.length} piezas con descuento`}, mientras
          duren las unidades.
        </p>
      </header>

      {promos.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {promos.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-secondary">En este momento no hay promociones activas.</p>
          <Link href="/coleccion" className="btn-outline mt-6">
            Ver la colección
          </Link>
        </div>
      )}
    </div>
  );
}

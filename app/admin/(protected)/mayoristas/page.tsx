import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { WHOLESALE_PREFIX } from "@/lib/wholesale-auth";
import { formatCOP } from "@/lib/format";
import WholesaleLink from "@/components/admin/WholesaleLink";

// Gestión de la tienda mayorista desde el panel. La página vive dentro del
// grupo (protected): requiere sesión ADMIN (layout + middleware).
export default async function MayoristasAdminPage() {
  const secret = process.env.WHOLESALE_SECRET;
  const url = secret ? `${site.url}/${WHOLESALE_PREFIX}${secret}` : null;

  const [wholesaleCount, sinPrecio, recent] = await Promise.all([
    prisma.product.count({ where: { isWholesale: true } }),
    prisma.product.count({ where: { isWholesale: true, wholesalePrice: null } }),
    prisma.product.findMany({
      where: { isWholesale: true },
      select: {
        id: true,
        slug: true,
        name: true,
        wholesalePrice: true,
        retailPrice: true,
        category: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl text-primary">Mayoristas</h1>

      {/* Enlace secreto */}
      <section className="mb-8 rounded-2xl border border-border bg-white p-6">
        <h2 className="font-serif text-xl text-primary">Enlace privado de la tienda</h2>
        <p className="mb-4 mt-1 text-sm text-secondary">
          Compártelo solo con tus distribuidores (por WhatsApp, por ejemplo). Quien
          tenga este enlace ve los precios de mayorista. No aparece en Google ni está
          enlazado desde la página pública.
        </p>
        {url ? (
          <WholesaleLink url={url} />
        ) : (
          <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Falta configurar WHOLESALE_SECRET en las variables de entorno; la tienda
            mayorista está cerrada.
          </p>
        )}
      </section>

      {/* Resumen */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-secondary">Productos publicados en mayoristas</p>
          <p className="mt-1 font-serif text-4xl text-primary">{wholesaleCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-secondary">Sin precio mayorista (usan el de venta)</p>
          <p className={`mt-1 font-serif text-4xl ${sinPrecio > 0 ? "text-amber-600" : "text-primary"}`}>
            {sinPrecio}
          </p>
        </div>
      </section>

      {/* Cómo publicar */}
      <section className="mb-8 rounded-2xl border border-border bg-white p-6">
        <h2 className="font-serif text-xl text-primary">¿Cómo publicar un producto aquí?</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-secondary">
          <li>
            Ve a <Link href="/admin/productos" className="text-accent underline-offset-2 hover:underline">Productos</Link> y
            abre (o crea) el producto.
          </li>
          <li>Escribe su <strong>precio mayorista</strong>.</li>
          <li>Marca la casilla <strong>“Visible en mayoristas”</strong> y guarda.</li>
        </ol>
      </section>

      {/* Últimos publicados */}
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="mb-4 font-serif text-xl text-primary">Últimos publicados</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-secondary">Todavía no hay productos en la tienda mayorista.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <Link
                    href={`/admin/productos/${p.id}`}
                    className="block truncate font-medium text-primary hover:text-accent"
                  >
                    {p.name}
                  </Link>
                  <span className="text-xs text-secondary">{p.category.name} · {p.slug}</span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-medium text-primary">
                    {formatCOP(p.wholesalePrice ?? p.retailPrice)}
                  </p>
                  {p.wholesalePrice == null && (
                    <p className="text-xs text-amber-600">sin precio mayorista</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

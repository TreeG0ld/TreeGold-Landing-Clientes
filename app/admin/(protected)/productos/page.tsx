import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import ProductsTable from "@/components/admin/ProductsTable";
import GlassSelect from "@/components/admin/GlassSelect";
import AdminSearchInput from "@/components/admin/AdminSearchInput";

const PER_PAGE = 30;

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const categoryId = sp.categoria ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const where = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-primary">Productos</h1>
          <p className="text-sm text-secondary">{total} en total</p>
        </div>
        <Link href="/admin/productos/nuevo" className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nuevo producto
        </Link>
      </div>

      {/* Sin botón "Filtrar": el buscador filtra mientras se escribe y el
          selector de categoría envía el formulario al cambiar. */}
      <form method="GET" className="mb-5 flex flex-wrap items-center gap-3">
        <AdminSearchInput defaultValue={q} />
        <GlassSelect
          name="categoria"
          value={categoryId}
          submitOnChange
          className="h-11 w-56"
          options={[
            { value: "", label: "Todas las categorías" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      </form>

      <ProductsTable products={products} />

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/admin/productos?${new URLSearchParams({ ...(q ? { q } : {}), ...(categoryId ? { categoria: categoryId } : {}), page: String(n) })}`}
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                n === page ? "bg-primary text-white" : "text-secondary hover:bg-muted"
              }`}
            >
              {n}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

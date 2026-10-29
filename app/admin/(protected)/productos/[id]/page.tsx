import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditarProductoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ volver?: string }>;
}) {
  const { id } = await params;
  // Solo se aceptan los tres filtros del listado: lo demás se descarta para
  // que `volver` no pueda armar una URL arbitraria.
  const volver = new URLSearchParams((await searchParams).volver ?? "");
  const returnQuery = new URLSearchParams(
    (["q", "categoria", "page"] as const).flatMap((k) => {
      const v = volver.get(k);
      return v ? [[k, v] as [string, string]] : [];
    })
  ).toString();
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl text-primary">Editar producto</h1>
      <ProductForm
        categories={categories}
        returnQuery={returnQuery}
        initialValues={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          retailPrice: String(product.retailPrice),
          wholesalePrice: product.wholesalePrice != null ? String(product.wholesalePrice) : "",
          stock: String(product.stock),
          material: product.material ?? "",
          size: product.size ?? "",
          images: product.images,
          isRetail: product.isRetail,
          isWholesale: product.isWholesale,
          isPromo: product.isPromo,
          originalPrice: product.originalPrice != null ? String(product.originalPrice) : "",
        }}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

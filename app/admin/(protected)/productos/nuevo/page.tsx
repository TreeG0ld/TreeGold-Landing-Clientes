import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";

export default async function NuevoProductoPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl text-primary">Nuevo producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}

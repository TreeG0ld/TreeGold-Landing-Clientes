import { prisma } from "@/lib/prisma";
import CategoriesManager from "@/components/admin/CategoriesManager";

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl text-primary">Categorías</h1>
      <CategoriesManager categories={categories} />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import ProductCard from "@/components/ProductCard";
import SortDropdown from "@/components/SortDropdown";
import type { Product, Category } from "@/lib/products";

const sorts = [
  { id: "destacados", label: "Destacados" },
  { id: "precio-asc", label: "Precio: menor a mayor" },
  { id: "precio-desc", label: "Precio: mayor a menor" },
];

export default function CatalogClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const params = useSearchParams();
  const initialCat = params.get("categoria") ?? "todos";
  const [cat, setCat] = useState(initialCat);
  const [sort, setSort] = useState("destacados");

  const filtered = useMemo(() => {
    let list =
      cat === "todos" ? products : products.filter((p) => p.category === cat);
    list = [...list];
    if (sort === "precio-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "precio-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "destacados")
      list.sort((a, b) => Number(b.featured) - Number(a.featured));
    return list;
  }, [products, cat, sort]);

  const tabs = [{ slug: "todos", name: "Todo" }, ...categories];

  return (
    <div>
      {/* Filtros */}
      <div className="sticky top-16 z-30 -mx-5 mb-10 border-b border-border glass px-5 py-3 md:top-20 md:mx-0 md:rounded-2xl md:border md:px-5 md:py-3.5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {/* Categorías: scroll horizontal en móvil, se acomodan en varias líneas en escritorio */}
          <div className="flex gap-2 overflow-x-auto pb-1 md:flex-1 md:flex-wrap md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => (
              <button
                key={t.slug}
                onClick={() => setCat(t.slug)}
                className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 cursor-pointer ${
                  cat === t.slug
                    ? "text-white"
                    : "text-secondary hover:text-primary"
                }`}
              >
                {cat === t.slug && (
                  <motion.span
                    layoutId="cat-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {t.name}
              </button>
            ))}
          </div>

          {/* Ordenar: separado, no pisa las categorías */}
          <div className="shrink-0 self-end md:self-auto md:border-l md:border-border md:pl-4">
            <SortDropdown options={sorts} value={sort} onChange={setSort} />
          </div>
        </div>
      </div>

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <p className="py-20 text-center text-secondary">
          No hay piezas en esta categoría todavía.
        </p>
      )}
    </div>
  );
}

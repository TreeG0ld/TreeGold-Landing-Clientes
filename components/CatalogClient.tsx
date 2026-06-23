"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import ProductCard from "@/components/ProductCard";
import SortDropdown from "@/components/SortDropdown";
import { products, categories } from "@/lib/products";

const sorts = [
  { id: "destacados", label: "Destacados" },
  { id: "precio-asc", label: "Precio: menor a mayor" },
  { id: "precio-desc", label: "Precio: mayor a menor" },
];

export default function CatalogClient() {
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
  }, [cat, sort]);

  const tabs = [{ slug: "todos", name: "Todo" }, ...categories];

  return (
    <div>
      {/* Filtros */}
      <div className="sticky top-16 z-30 -mx-5 mb-10 border-b border-border glass px-5 py-3 md:top-20 md:mx-0 md:rounded-full md:border md:px-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

          <SortDropdown options={sorts} value={sort} onChange={setSort} />
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

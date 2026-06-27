"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { coleccionHref } from "@/lib/catalog-url";

export type CategoryOption = { slug: string; name: string };

// Filtro de categoría en acordeón: un botón colapsado que despliega la lista
// completa de categorías hacia abajo, en vez de una fila de pills horizontal.
// Mejor organización con 10+ categorías y escala sin romper el layout móvil.
export default function CategoryFilter({
  categories,
  value,
  sort,
}: {
  categories: CategoryOption[];
  value: string;
  sort: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const current = categories.find((c) => c.slug === value) ?? categories[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative w-full md:w-64">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Categoría"
        className={`flex w-full items-center justify-between gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-luxe cursor-pointer ${
          open
            ? "border-accent text-primary"
            : "border-border text-secondary hover:border-accent hover:text-primary"
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <span className="hidden text-secondary/60 sm:inline">Categoría:</span>
          <span className="truncate">{current.name}</span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.65, 0, 0.35, 1] }}
        >
          <ChevronDown className="h-4 w-4 shrink-0" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.65, 0, 0.35, 1] }}
            className="glass absolute left-0 right-0 z-50 mt-2 max-h-[60vh] origin-top overflow-y-auto rounded-2xl border border-border/70 p-1.5 shadow-xl shadow-black/10 md:w-64"
          >
            {categories.map((c) => {
              const active = c.slug === value;
              return (
                <li key={c.slug} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push(coleccionHref({ category: c.slug, sort, page: 1 }));
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors duration-200 cursor-pointer ${
                      active
                        ? "bg-primary text-white"
                        : "text-secondary hover:bg-muted hover:text-primary"
                    }`}
                  >
                    {c.name}
                    {active && <Check className="h-4 w-4 text-accent-soft" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

// Carrusel de categorías de la home ("Encuentra tu pieza").
// Reemplaza la grilla anterior: en móvil las tarjetas son más compactas y se
// deslizan con swipe; en desktop se navega también con flechas.

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CategoryCard from "@/components/CategoryCard";
import type { Category } from "@/lib/products";

export default function CategoryCarousel({ categories }: { categories: Category[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-4">
          {categories.map((c) => (
            <div
              key={c.slug}
              className="min-w-0 flex-[0_0_58%] sm:flex-[0_0_38%] lg:flex-[0_0_24%]"
            >
              <CategoryCard category={c} className="aspect-[3/4]" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 hidden justify-end gap-2 md:flex">
        <button
          type="button"
          aria-label="Anterior"
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canPrev}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-primary transition-colors hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-border disabled:hover:text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Siguiente"
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canNext}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-primary transition-colors hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-border disabled:hover:text-primary"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

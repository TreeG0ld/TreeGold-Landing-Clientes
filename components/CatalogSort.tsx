"use client";

import { useRouter } from "next/navigation";
import SortDropdown from "@/components/SortDropdown";
import { coleccionHref, CATALOG_SORTS } from "@/lib/catalog-url";

// Control de orden: navega cambiando la URL (?orden=...), manteniendo la
// categoría actual y volviendo a la página 1.
export default function CatalogSort({
  category,
  value,
  q,
}: {
  category: string;
  value: string;
  q?: string;
}) {
  const router = useRouter();
  return (
    <SortDropdown
      options={CATALOG_SORTS}
      value={value}
      onChange={(v) => router.push(coleccionHref({ category, sort: v, page: 1, q }))}
    />
  );
}

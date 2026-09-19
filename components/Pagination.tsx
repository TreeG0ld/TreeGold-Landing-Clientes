import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { coleccionHref } from "@/lib/catalog-url";

// Genera la lista de páginas a mostrar con elipsis: 1 … 4 5 6 … 28
function pageList(current: number, total: number): (number | "…")[] {
  const want = new Set([1, total, current - 1, current, current + 1]);
  const pages = [...want].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of pages) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export default function Pagination({
  category,
  sort,
  page,
  totalPages,
  q,
}: {
  category: string;
  sort: string;
  page: number;
  totalPages: number;
  q?: string;
}) {
  if (totalPages <= 1) return null;

  const base = "flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors";
  const items = pageList(page, totalPages);

  return (
    <nav
      aria-label="Paginación"
      className="mt-14 flex items-center justify-center gap-1.5"
    >
      {/* Anterior */}
      {page > 1 ? (
        <Link
          href={coleccionHref({ category, sort, page: page - 1, q })}
          aria-label="Página anterior"
          className={`${base} border border-border text-primary hover:border-accent hover:text-accent`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={`${base} border border-border text-secondary/40`} aria-disabled>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {/* Números */}
      {items.map((it, i) =>
        it === "…" ? (
          <span key={`e${i}`} className={`${base} text-secondary/60`}>
            …
          </span>
        ) : it === page ? (
          <span key={it} aria-current="page" className={`${base} bg-primary text-white`}>
            {it}
          </span>
        ) : (
          <Link
            key={it}
            href={coleccionHref({ category, sort, page: it, q })}
            className={`${base} border border-border text-primary hover:border-accent hover:text-accent`}
          >
            {it}
          </Link>
        )
      )}

      {/* Siguiente */}
      {page < totalPages ? (
        <Link
          href={coleccionHref({ category, sort, page: page + 1, q })}
          aria-label="Página siguiente"
          className={`${base} border border-border text-primary hover:border-accent hover:text-accent`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={`${base} border border-border text-secondary/40`} aria-disabled>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}

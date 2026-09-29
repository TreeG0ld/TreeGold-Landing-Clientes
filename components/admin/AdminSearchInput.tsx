"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// Espera tras la última tecla antes de consultar: sin ella, escribir
// "pulsera" lanzaba siete búsquedas y los resultados parpadeaban.
const DEBOUNCE_MS = 300;

// Buscador del listado de productos del admin: filtra mientras se escribe.
// El filtrado sigue en el servidor (la tabla viene paginada de a 30, así que
// filtrar en el navegador solo buscaría en la página visible); aquí solo se
// actualiza `?q=` en la URL, lo que además deja la búsqueda en el historial y
// al recargar.
export default function AdminSearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [pending, startTransition] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    // No navega al montar: la URL ya tiene la búsqueda con la que se cargó.
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const q = value.trim();
      if (q) params.set("q", q);
      else params.delete("q");
      // Otra búsqueda son otros resultados: se vuelve a la primera página.
      params.delete("page");
      const qs = params.toString();
      startTransition(() => {
        // `replace` y no `push`: cada letra no debe quedar como un paso del
        // botón Atrás.
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
    // Solo reacciona a lo que se escribe; searchParams cambia por la propia
    // navegación y volvería a dispararlo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative flex-1 min-w-[220px]">
      <input
        type="text"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar por nombre o código..."
        autoComplete="off"
        className="h-11 w-full rounded-xl border border-border px-4 py-2.5 pr-10 text-base md:text-sm outline-none focus:border-accent"
      />
      {pending && (
        <Loader2
          aria-label="Buscando"
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-secondary/60"
        />
      )}
    </div>
  );
}

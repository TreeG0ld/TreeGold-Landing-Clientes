"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";

// En píxeles y no en clases de ancho porque se animan como número: 40 es el
// círculo cerrado (igual que el alto) y 240 entra sin apretar en un celular.
const CLOSED_WIDTH = 40;
const OPEN_WIDTH = 240;

// Buscador del catálogo mayorista. Con cientos de referencias, recorrer la
// rejilla a mano es inviable.
//
// Clave de la animación: cerrado y abierto son EL MISMO elemento cambiando de
// ancho, no dos componentes que se reemplazan. Con el intercambio, el botón se
// desmontaba y el formulario aparecía de golpe —no hay forma de animar entre
// dos elementos distintos—; estirando uno solo, la transición es continua.
export default function WholesaleSearch({
  base,
  categoria,
  initialQuery,
}: {
  /** Ruta del catálogo, p. ej. "/mayoristas-<código>". */
  base: string;
  categoria: string;
  initialQuery: string;
}) {
  // Si se llegó con una búsqueda activa, arranca abierto: cerrarlo escondería
  // el término por el que se está filtrando.
  const [open, setOpen] = useState(Boolean(initialQuery));
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function hrefCon(q: string) {
    const sp = new URLSearchParams();
    if (categoria && categoria !== "todos") sp.set("categoria", categoria);
    if (q.trim()) sp.set("q", q.trim());
    const qs = sp.toString();
    return `${base}${qs ? `?${qs}` : ""}`;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(hrefCon(query));
  }

  function cerrar() {
    setQuery("");
    setOpen(false);
    if (initialQuery) router.push(hrefCon(""));
  }

  return (
    <motion.form
      onSubmit={submit}
      // Se anima el ANCHO como propiedad y no con `layout`: esa animación
      // escala el elemento, y al escalarlo deforma lo que lleva dentro — la
      // lupa, la ✕ y el borde redondeado se estiraban al cerrar.
      initial={false}
      animate={{ width: open ? OPEN_WIDTH : CLOSED_WIDTH }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex h-10 shrink-0 items-center overflow-hidden rounded-full border transition-colors ${
        open
          ? "border-border bg-white/80"
          : "border-border bg-transparent hover:border-accent"
      }`}
    >
      {/* La lupa no se mueve: queda fija a la izquierda y el campo crece a su
          derecha, así el ojo tiene un punto de anclaje durante la animación. */}
      <span className="pointer-events-none absolute left-0 flex h-10 w-10 items-center justify-center text-secondary">
        <Search className="h-4 w-4" />
      </span>

      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && cerrar()}
        placeholder="Buscar pieza..."
        aria-label="Buscar pieza por nombre"
        // Cerrado queda recortado por el contenedor; se apaga para que no lo
        // alcance el tabulador ni los lectores de pantalla.
        disabled={!open}
        tabIndex={open ? 0 : -1}
        className={`h-10 w-full bg-transparent pl-10 pr-9 text-base outline-none transition-opacity duration-300 md:text-sm ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {open ? (
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar buscador"
          className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full text-secondary transition-colors hover:text-primary cursor-pointer"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      ) : (
        // Cubre toda la píldora cerrada: el objetivo táctil es el círculo
        // entero, no solo el icono.
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buscar piezas"
          className="absolute inset-0 cursor-pointer"
        />
      )}
    </motion.form>
  );
}

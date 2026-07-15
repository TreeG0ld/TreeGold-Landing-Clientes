"use client";

// Reemplazo estilizado del <select> nativo (el menú del sistema no se puede
// estilizar). Mismo lenguaje visual que SortDropdown de la tienda pública:
// panel "liquid glass" (translúcido + blur), animación suave y hover con
// acento. Pensado para formularios: expone un <input type="hidden"> con
// `name` para que funcione dentro de un <form method="GET"> y puede
// auto-enviar el form al elegir (submitOnChange).

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown } from "lucide-react";

export type GlassOption = { value: string; label: string };

export default function GlassSelect({
  options,
  value,
  onChange,
  name,
  placeholder = "Selecciona…",
  submitOnChange = false,
  className = "",
}: {
  options: GlassOption[];
  value: string;
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  submitOnChange?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // Si el padre controla el valor (onChange), manda el prop; si no, el estado interno.
  const current = onChange ? value : internal;
  const selected = options.find((o) => o.value === current);

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

  const pick = (v: string) => {
    if (onChange) onChange(v);
    else setInternal(v);
    setOpen(false);
    if (submitOnChange) {
      // Espera al render para que el hidden input tenga el valor nuevo.
      requestAnimationFrame(() => ref.current?.closest("form")?.requestSubmit());
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={current} />}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-2.5 text-base md:text-sm outline-none transition-all duration-300 ease-luxe cursor-pointer ${
          open ? "border-accent text-primary" : "border-border text-primary hover:border-accent"
        }`}
      >
        <span className={`truncate text-left ${selected ? "" : "text-secondary/70"}`}>
          {selected?.label ?? placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.65, 0, 0.35, 1] }}
          className="shrink-0 text-secondary"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.65, 0, 0.35, 1] }}
            className="glass absolute left-0 z-50 mt-2 max-h-72 w-full min-w-56 origin-top overflow-y-auto rounded-2xl border border-border/60 p-1.5 shadow-xl shadow-black/10"
          >
            {options.map((o) => {
              const active = o.value === current;
              return (
                <li key={o.value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => pick(o.value)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition-all duration-200 cursor-pointer ${
                      active
                        ? "bg-primary text-on-primary"
                        : "text-secondary hover:bg-white/70 hover:pl-4 hover:text-primary"
                    }`}
                  >
                    {o.label}
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

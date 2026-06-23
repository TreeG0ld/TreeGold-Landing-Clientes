"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown } from "lucide-react";

export type Option = { id: string; label: string };

export default function SortDropdown({
  options,
  value,
  onChange,
  label = "Ordenar",
}: {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value) ?? options[0];

  // Cerrar al hacer clic fuera o con Escape
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
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ease-luxe cursor-pointer ${
          open
            ? "border-accent text-primary"
            : "border-border text-secondary hover:border-accent hover:text-primary"
        }`}
      >
        <span className="hidden text-secondary/60 sm:inline">{label}:</span>
        <span className="whitespace-nowrap">{current.label}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.65, 0, 0.35, 1] }}
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
            className="glass absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-border/70 p-1.5 shadow-xl shadow-black/10"
          >
            {options.map((o) => {
              const active = o.id === value;
              return (
                <li key={o.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors duration-200 cursor-pointer ${
                      active
                        ? "bg-primary text-on-primary"
                        : "text-secondary hover:bg-muted hover:text-primary"
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

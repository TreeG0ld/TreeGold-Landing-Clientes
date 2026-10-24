"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useAdminTheme } from "./AdminTheme";

// Interruptor claro / oscuro del panel: una pastilla con un botón redondo que
// lleva el sol o la luna. Idea tomada del componente "ThemeChanger" de Framer,
// escrita aquí desde cero.
//
// Todo el movimiento es CSS de transform y opacity, que el navegador anima en
// la tarjeta gráfica: así el botón se desliza fluido aunque la página esté
// ocupada aplicando el tema nuevo.
//   - Capa de fuera: se desliza de lado a lado con una curva que se pasa un
//     poco y vuelve (rebote al llegar).
//   - Capa de dentro: se aplasta hacia los lados mientras viaja y vuelve a ser
//     redonda (keyframes theme-knob-squash-* en app/globals.css).
export default function ThemeToggle() {
  const { theme, toggle } = useAdminTheme();
  const dark = theme === "dark";
  // El estirón solo después de un clic: si no, se vería al cargar la página.
  const [touched, setTouched] = useState(false);

  // Dos keyframes iguales con distinto nombre: al alternar, la animación se
  // repite en cada cambio.
  const squash = touched
    ? dark
      ? "[animation:theme-knob-squash-a_480ms_cubic-bezier(.3,.7,.4,1)]"
      : "[animation:theme-knob-squash-b_480ms_cubic-bezier(.3,.7,.4,1)]"
    : "";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Modo oscuro"
      title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={(e) => {
        setTouched(true);
        // El cambio de tema nace en el centro del interruptor.
        const r = e.currentTarget.getBoundingClientRect();
        toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      // Lo saca de la foto del cambio de tema para que su deslizamiento se
      // vea en vivo (view-transition-name en app/globals.css).
      data-theme-toggle
      className="relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border border-border bg-muted transition-colors duration-500 hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <span
        aria-hidden
        className={`absolute left-[3px] top-[3px] h-6 w-6 transition-transform duration-500 ease-[cubic-bezier(.34,1.5,.5,1)] motion-reduce:transition-none ${
          dark ? "translate-x-6" : "translate-x-0"
        }`}
      >
        <span
          className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.22)] motion-reduce:animate-none ${squash}`}
        >
          {/* Los dos íconos están siempre; se cruzan girando. */}
          <Sun
            className={`absolute h-3.5 w-3.5 text-amber-500 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.34,1.5,.5,1)] ${
              dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
            }`}
            strokeWidth={2.5}
          />
          <Moon
            className={`absolute h-3.5 w-3.5 fill-stone-600 text-stone-600 transition-[transform,opacity] duration-500 ease-[cubic-bezier(.34,1.5,.5,1)] ${
              dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
            }`}
            strokeWidth={2}
          />
        </span>
      </span>
    </button>
  );
}

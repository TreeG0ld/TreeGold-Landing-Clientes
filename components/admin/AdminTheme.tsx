"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { flushSync } from "react-dom";
import { ADMIN_THEME_COOKIE, type AdminThemeName } from "@/lib/admin-theme";

/** Punto de la pantalla (centro del interruptor) desde el que nace el cambio. */
type RevealOrigin = { x: number; y: number };

type AdminThemeContextValue = {
  theme: AdminThemeName;
  toggle: (origin: RevealOrigin) => void;
};

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

export function useAdminTheme(): AdminThemeContextValue {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) throw new Error("useAdminTheme debe usarse dentro de <AdminTheme>");
  return ctx;
}

// Envuelve todo /admin. El atributo data-admin-theme del <div> es el que
// cambia la paleta (variables de color en app/globals.css) y activa las clases
// `dark:` de Tailwind (tailwind.config.ts). Va en este <div> y no en <html>
// para que el modo oscuro no pueda filtrarse a la tienda pública: al salir del
// panel este componente desaparece y con él el atributo.
export default function AdminTheme({
  initial,
  children,
}: {
  initial: AdminThemeName;
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<AdminThemeName>(initial);

  const toggle = useCallback(
    ({ x, y }: RevealOrigin) => {
      const next: AdminThemeName = theme === "dark" ? "light" : "dark";
      const secure = window.location.protocol === "https:" ? "; secure" : "";
      document.cookie = `${ADMIN_THEME_COOKIE}=${next}; path=/admin; max-age=31536000; samesite=lax${secure}`;

      // flushSync: React pinta el tema nuevo en el acto, dentro de la
      // transición. Sin soporte de View Transitions o con "reducir
      // movimiento", el cambio es directo.
      const apply = () => flushSync(() => setTheme(next));
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (typeof document.startViewTransition !== "function" || reduceMotion) {
        apply();
        return;
      }

      // View Transitions: el navegador toma una foto de la página, aplica el
      // tema nuevo y lo revela dentro de un círculo de borde difuminado que
      // nace en el interruptor (máscara en app/globals.css). Se anima en la
      // tarjeta gráfica sobre la foto, así que no se traba aunque la página
      // sea pesada; una transición CSS en cada elemento congelaba la tabla de
      // productos.
      //
      // Radio final: lo justo para cubrir la esquina de la pantalla más lejana
      // al interruptor, entre 0,8 porque el 20% exterior es el borde suave.
      const far = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      const end = Math.ceil(far / 0.8);

      // El centro y el radio se animan directamente sobre la capa del tema
      // nuevo (Web Animations API), no se heredan de <html>. Arranca despacio
      // para que se vea nacer en el interruptor y luego acelera.
      document
        .startViewTransition(apply)
        .ready.then(() => {
          document.documentElement.animate(
            {
              "--admin-reveal-x": [`${x}px`, `${x}px`],
              "--admin-reveal-y": [`${y}px`, `${y}px`],
              "--admin-reveal": ["0px", `${end}px`],
            },
            {
              duration: 1000,
              easing: "cubic-bezier(0.5, 0, 0.3, 1)",
              fill: "both",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        // Se rechaza si la transición se salta (p. ej. dos clics seguidos):
        // el tema igual queda aplicado.
        .catch(() => {});
    },
    [theme]
  );

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      <div data-admin-theme={theme} className="min-h-dvh bg-background text-foreground">
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

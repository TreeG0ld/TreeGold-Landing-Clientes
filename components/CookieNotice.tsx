"use client";

import { useEffect, useState } from "react";

// Aviso de cookies. Google Analytics las usa y la ley colombiana de protección
// de datos pide informarlo.
//
// Es una FRANJA y no una ventana a propósito: la tienda ya abre un aviso
// obligatorio de medios de pago en cada carga, y encadenar dos ventanas antes
// de que el cliente vea una sola joya espanta gente. Esta no bloquea nada.
const SEEN_KEY = "treegold-cookies-visto";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setVisible(true);
    } catch {
      // Navegación privada o almacenamiento bloqueado: no se muestra. Es
      // preferible a insistir en cada carga con un aviso que no se puede
      // recordar.
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Si no se puede guardar, se cierra igual en esta visita.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      // z-40 es el mismo del botón de WhatsApp, y por debajo del aviso de
      // pagos (z-100): mientras ese esté abierto, esta franja no compite.
      // El margen derecho en escritorio deja libre el botón de WhatsApp.
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border px-5 py-3 md:bottom-4 md:left-4 md:right-28 md:rounded-2xl md:border"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-center text-xs leading-relaxed text-secondary sm:text-left">
          Usamos cookies para entender cómo se navega la tienda y mejorarla. No
          recogemos datos personales ni los compartimos con terceros.
        </p>
        <button
          onClick={accept}
          className="shrink-0 cursor-pointer rounded-full bg-primary px-5 py-2 text-xs font-medium tracking-wide text-on-primary transition-colors duration-300 hover:bg-accent"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

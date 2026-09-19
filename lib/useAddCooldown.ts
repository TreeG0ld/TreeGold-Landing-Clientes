"use client";

import { useEffect, useRef, useState } from "react";

// Se permiten 3 "agregar" seguidos del mismo producto —quien de verdad quiere
// llevar varias iguales— y a partir del cuarto se corta con un aviso. Sin este
// tope, machacar el botón mete decenas de unidades en la selección y apila una
// animación de vuelo por clic hasta tapar la pantalla.
export const ADD_BURST = 3;
export const ADD_COOLDOWN_MS = 3000;
export const ADD_COOLDOWN_SECONDS = Math.round(ADD_COOLDOWN_MS / 1000);

export function useAddCooldown() {
  // Racha y relojes viven en refs, no en estado: dos clics muy seguidos
  // ocurren antes de que React vuelva a renderizar, así que un contador de
  // estado dejaría pasar el segundo.
  const streak = useRef(0);
  const lastAddAt = useRef(0);
  const blockedUntil = useRef(0);
  const [waiting, setWaiting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function showNotice(ms: number) {
    setWaiting(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setWaiting(false), ms);
  }

  // true = el clic se atiende; false = está en espera.
  function claim(): boolean {
    const now = Date.now();

    if (now < blockedUntil.current) {
      showNotice(blockedUntil.current - now);
      return false;
    }

    // Una pausa larga rompe la racha: el cliente volvió después a agregar otra,
    // no está machacando el botón.
    if (now - lastAddAt.current > ADD_COOLDOWN_MS) streak.current = 0;

    lastAddAt.current = now;
    streak.current += 1;

    if (streak.current > ADD_BURST) {
      blockedUntil.current = now + ADD_COOLDOWN_MS;
      streak.current = 0;
      showNotice(ADD_COOLDOWN_MS);
      return false;
    }

    return true;
  }

  return { waiting, claim };
}

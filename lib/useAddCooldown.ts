"use client";

import { useEffect, useRef, useState } from "react";

// Se permiten 3 "agregar" seguidos del mismo producto —quien de verdad quiere
// llevar varias iguales— y a partir del cuarto se corta con un aviso. Sin este
// tope, machacar el botón mete decenas de unidades en la selección y apila una
// animación de vuelo por clic hasta tapar la pantalla.
export const ADD_BURST = 3;
export const ADD_COOLDOWN_MS = 3000;

export function useAddCooldown() {
  // Racha y relojes viven en refs, no en estado: dos clics muy seguidos
  // ocurren antes de que React vuelva a renderizar, así que un contador de
  // estado dejaría pasar el segundo.
  const streak = useRef(0);
  const lastAddAt = useRef(0);
  const blockedUntil = useRef(0);
  // Segundos que faltan; 0 = no hay espera. El componente lo pinta tal cual.
  const [remaining, setRemaining] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopTick() {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
  }

  useEffect(() => stopTick, []);

  // Cuenta regresiva hasta `until`. Se refresca cada 250 ms y no cada segundo
  // para que el número cambie justo cuando toca: con un intervalo de 1 s, el
  // primer salto se veía tarde si el clic caía a mitad de segundo.
  function countdownTo(until: number) {
    stopTick();
    const update = () => {
      const left = Math.ceil((until - Date.now()) / 1000);
      if (left <= 0) {
        setRemaining(0);
        stopTick();
        return;
      }
      setRemaining(left);
    };
    update();
    tick.current = setInterval(update, 250);
  }

  // true = el clic se atiende; false = está en espera.
  function claim(): boolean {
    const now = Date.now();

    if (now < blockedUntil.current) {
      countdownTo(blockedUntil.current);
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
      countdownTo(blockedUntil.current);
      return false;
    }

    return true;
  }

  return { remaining, claim };
}

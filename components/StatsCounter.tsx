"use client";

import { useEffect, useRef } from "react";
import { onEnterView } from "@/lib/on-enter-view";

// power2.out de GSAP (la curva que usaba antes): rápido al inicio, suave al final.
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const DURATION_MS = 2000;

export type Stat = { value: number; suffix?: string; label: string };

// Los números se reciben por prop (no hardcodeados aquí): la página que usa
// este componente (/historia) los arma con datos reales.
export default function StatsCounter({ stats }: { stats: Stat[] }) {
  const root = useRef<HTMLDivElement>(null);

  // Cada número cuenta de 0 a su valor al entrar en pantalla. Con
  // requestAnimationFrame y no con GSAP: era la única razón para cargar la
  // librería en /historia.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const frames = new Set<number>();
    const stops = Array.from(el.querySelectorAll<HTMLElement>(".stat-num")).map((num) =>
      onEnterView(num, 0.88, () => {
        const end = Number(num.dataset.value);
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION_MS);
          num.textContent = Math.round(end * easeOut(t)).toLocaleString("es-CO");
          if (t < 1) frames.add(requestAnimationFrame(tick));
        };
        frames.add(requestAnimationFrame(tick));
      })
    );
    return () => {
      stops.forEach((stop) => stop());
      frames.forEach((id) => cancelAnimationFrame(id));
    };
  }, []);

  return (
    <div
      ref={root}
      className="grid grid-cols-2 gap-y-10 md:grid-cols-4"
    >
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <p className="font-serif text-5xl text-primary md:text-6xl">
            <span className="stat-num" data-value={s.value}>
              0
            </span>
            <span className="text-gold">{s.suffix}</span>
          </p>
          <p className="mt-2 text-xs uppercase tracking-luxe text-secondary/70">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

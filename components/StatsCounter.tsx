"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { onEnterView } from "@/lib/on-enter-view";

gsap.registerPlugin(useGSAP);

export type Stat = { value: number; suffix?: string; label: string };

// Los números se reciben por prop (no hardcodeados aquí): la página que usa
// este componente (/historia) los arma con datos reales.
export default function StatsCounter({ stats }: { stats: Stat[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const nums = gsap.utils.toArray<HTMLElement>(".stat-num");
      // Cada número cuenta al entrar en pantalla (antes con ScrollTrigger;
      // ver lib/on-enter-view.ts).
      const stops = nums.map((el) =>
        onEnterView(el, 0.88, () => {
          const end = Number(el.dataset.value);
          const obj = { val: 0 };
          gsap.to(obj, {
            val: end,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = Math.round(obj.val).toLocaleString("es-CO");
            },
          });
        })
      );
      return () => stops.forEach((stop) => stop());
    },
    { scope: root }
  );

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

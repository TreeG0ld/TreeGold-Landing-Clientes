"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export type Stat = { value: number; suffix?: string; label: string };

// Los números se reciben por prop (no hardcodeados aquí): la página que usa
// este componente (/historia) los arma con datos reales.
export default function StatsCounter({ stats }: { stats: Stat[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const nums = gsap.utils.toArray<HTMLElement>(".stat-num");
      nums.forEach((el) => {
        const end = Number(el.dataset.value);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: end,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
          onUpdate: () => {
            el.textContent = Math.round(obj.val).toLocaleString("es-CO");
          },
        });
      });
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

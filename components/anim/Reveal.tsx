"use client";

import { useLayoutEffect, useRef, type ElementType, type ReactNode } from "react";
import { onEnterView } from "@/lib/on-enter-view";

type RevealProps = {
  children: ReactNode;
  /** Selector hijo a animar en cascada (stagger). Si se omite, anima el contenedor. */
  stagger?: number;
  childSelector?: string;
  y?: number;
  delay?: number;
  duration?: number;
  as?: ElementType;
  className?: string;
};

// power3.out de GSAP, la curva que usaba este componente.
const EASE_OUT = "cubic-bezier(0.165, 0.84, 0.44, 1)";

// Aparece al llegar con el scroll, una sola vez, cuando el borde superior del
// bloque pasa el 85% de la pantalla (lib/on-enter-view.ts). La animación es
// de la Web Animations API del navegador: antes era GSAP, una librería que el
// celular tenía que descargar en cada visita solo para esto.
// Anima opacity + translateY (solo transform/opacity => 60fps).
export default function Reveal({
  children,
  stagger = 0.1,
  childSelector,
  y = 40,
  delay = 0,
  duration = 0.9,
  as,
  className,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const Tag = (as ?? "div") as ElementType;

  // Layout effect: oculta ANTES de que el navegador pinte tras hidratar; con
  // useEffect se alcanzaba a ver el contenido un instante antes de esconderse.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = childSelector
      ? Array.from(root.querySelectorAll<HTMLElement>(childSelector))
      : [root];

    // Ocultos (y fuera del foco del teclado, igual que el autoAlpha de GSAP)
    // hasta que entren en pantalla.
    for (const t of targets) {
      t.style.opacity = "0";
      t.style.visibility = "hidden";
    }

    const stop = onEnterView(root, 0.85, () => {
      targets.forEach((t, i) => {
        t.style.opacity = "";
        t.style.visibility = "";
        // fill "backwards": mientras espera su turno en la cascada se queda
        // en el primer fotograma (oculto y abajo); al terminar vuelve a sus
        // propios estilos, sin dejar nada pegado.
        t.animate(
          [
            { opacity: 0, transform: `translateY(${y}px)` },
            { opacity: 1, transform: "none" },
          ],
          {
            duration: duration * 1000,
            delay: (delay + (childSelector ? i * stagger : 0)) * 1000,
            easing: EASE_OUT,
            fill: "backwards",
          }
        );
      });
    });

    return () => {
      stop();
      for (const t of targets) {
        t.style.opacity = "";
        t.style.visibility = "";
        t.getAnimations().forEach((a) => a.cancel());
      }
    };
  }, [childSelector, stagger, y, delay, duration]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

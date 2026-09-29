"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { onEnterView } from "@/lib/on-enter-view";

gsap.registerPlugin(useGSAP);

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

// Aparece al llegar con el scroll: GSAP anima, IntersectionObserver decide
// cuándo (ver lib/on-enter-view.ts: antes era ScrollTrigger). Se dispara una
// sola vez, cuando el borde superior del bloque pasa el 85% de la pantalla.
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

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const targets = childSelector
        ? root.querySelectorAll(childSelector)
        : [root];

      gsap.set(targets, { autoAlpha: 0, y });
      // Lo que devuelve se ejecuta al desmontar (useGSAP): deja de observar.
      return onEnterView(root, 0.85, () =>
        gsap.to(targets, {
          autoAlpha: 1,
          y: 0,
          duration,
          delay,
          ease: "power3.out",
          stagger: childSelector ? stagger : 0,
        })
      );
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

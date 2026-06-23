"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

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
  start?: string;
  once?: boolean;
};

// Reveal por scroll con GSAP + ScrollTrigger.
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
  start = "top 85%",
  once = true,
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
      gsap.to(targets, {
        autoAlpha: 1,
        y: 0,
        duration,
        delay,
        ease: "power3.out",
        stagger: childSelector ? stagger : 0,
        scrollTrigger: {
          trigger: root,
          start,
          toggleActions: once
            ? "play none none none"
            : "play none none reverse",
        },
      });
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

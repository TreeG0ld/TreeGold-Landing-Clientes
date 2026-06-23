"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// Capa global que anima una burbuja con la foto del producto
// desde el punto de clic hasta el ícono del carrito (en arco).
export default function FlyToCart() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFly = (e: Event) => {
      const { x, y, image } = (e as CustomEvent).detail as {
        x: number;
        y: number;
        image: string;
      };
      const layer = layerRef.current;
      const target = document.querySelector<HTMLElement>("[data-cart-target]");
      if (!layer || !target) return;

      const tr = target.getBoundingClientRect();
      const endX = tr.left + tr.width / 2;
      const endY = tr.top + tr.height / 2;

      const pulse = () =>
        gsap.fromTo(
          target,
          { scale: 1 },
          { scale: 1.35, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }
        );

      // Respetar reduced-motion: solo el rebote del carrito.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        pulse();
        return;
      }

      const size = 68;
      const bubble = document.createElement("div");
      bubble.className = "fly-bubble";
      bubble.style.backgroundImage = `url(${image})`;
      layer.appendChild(bubble);

      gsap.set(bubble, {
        width: size,
        height: size,
        x: x - size / 2,
        y: y - size / 2,
        opacity: 1,
        scale: 1,
      });

      // Movimiento natural en arco, sin sobrepasar el carrito (que está arriba):
      // - X avanza suave y constante hacia el carrito.
      // - Y sube hacia el carrito (rápido al inicio, suave al final) sin pasarse.
      //   Como el carrito es el punto más alto, la burbuja nunca sale por arriba.
      // - al llegar se encoge y desvanece, como si entrara al carrito.
      const dur = 0.85;
      const endX2 = endX - size / 2;
      const endY2 = endY - size / 2;

      const tl = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: () => {
          bubble.remove();
          pulse();
        },
      });

      tl.to(bubble, { x: endX2, duration: dur, ease: "power1.inOut" }, 0)
        .to(bubble, { y: endY2, duration: dur, ease: "power3.out" }, 0)
        .to(
          bubble,
          { scale: 0.3, opacity: 0, duration: dur * 0.3, ease: "power1.in" },
          dur * 0.72
        );
    };

    window.addEventListener("fly-to-cart", onFly);
    return () => window.removeEventListener("fly-to-cart", onFly);
  }, []);

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
    />
  );
}

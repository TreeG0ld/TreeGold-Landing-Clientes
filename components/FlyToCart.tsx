"use client";

import { useEffect, useRef } from "react";

// Curvas equivalentes a las de GSAP que usaba esta animación.
const EASE_X = "cubic-bezier(0.455, 0.03, 0.515, 0.955)"; // power1.inOut
const EASE_Y = "cubic-bezier(0.165, 0.84, 0.44, 1)"; // power3.out
const EASE_SHRINK = "cubic-bezier(0.55, 0.085, 0.68, 0.53)"; // power1.in
const EASE_PULSE = "cubic-bezier(0.215, 0.61, 0.355, 1)"; // power2.out

// Capa global que anima una burbuja con la foto del producto
// desde el punto de clic hasta el ícono del carrito (en arco).
//
// Con la Web Animations API del navegador y no con GSAP: era una de las
// cuatro razones para descargar esa librería en cada visita.
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

      // Rebote del ícono del carrito. Usa la propiedad `scale` (no
      // `transform`) para no pisar las transformaciones propias del ícono.
      const pulse = () =>
        target.animate([{ scale: 1 }, { scale: 1.35 }, { scale: 1 }], {
          duration: 360,
          easing: EASE_PULSE,
        });

      // Respetar reduced-motion: solo el rebote del carrito.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        pulse();
        return;
      }

      const size = 68;
      const dur = 850;

      // Movimiento natural en arco, sin sobrepasar el carrito (que está arriba):
      // - X avanza suave y constante hacia el carrito.
      // - Y sube hacia el carrito (rápido al inicio, suave al final) sin pasarse.
      //   Como el carrito es el punto más alto, la burbuja nunca sale por arriba.
      // - al llegar se encoge y desvanece, como si entrara al carrito.
      // Cada eje lleva su propia curva, así que van en dos elementos: el de
      // afuera se mueve en X y la burbuja de adentro en Y (y se encoge).
      const carrier = document.createElement("div");
      carrier.style.position = "absolute";
      carrier.style.left = `${x - size / 2}px`;
      carrier.style.top = `${y - size / 2}px`;

      const bubble = document.createElement("div");
      bubble.className = "fly-bubble";
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.backgroundImage = `url(${image})`;

      carrier.appendChild(bubble);
      layer.appendChild(carrier);

      carrier.animate([{ translate: "0 0" }, { translate: `${endX - x}px 0` }], {
        duration: dur,
        easing: EASE_X,
        fill: "forwards",
      });
      bubble.animate([{ translate: "0 0" }, { translate: `0 ${endY - y}px` }], {
        duration: dur,
        easing: EASE_Y,
        fill: "forwards",
      });
      const shrink = bubble.animate(
        [
          { scale: 1, opacity: 1 },
          { scale: 0.3, opacity: 0 },
        ],
        {
          duration: dur * 0.3,
          delay: dur * 0.72,
          easing: EASE_SHRINK,
          fill: "forwards",
        }
      );

      shrink.onfinish = () => {
        carrier.remove();
        pulse();
      };
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

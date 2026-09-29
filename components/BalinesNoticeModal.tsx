"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { lockScroll } from "@/lib/scroll-lock";
import { BALINES_MIN_QTY, BALINES_SPECIAL_QTY } from "@/lib/wholesale-rules";
import { buildGeneralLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

// Aviso de las condiciones de venta de balinería. Aparece cada vez que se entra
// a esa categoría del catálogo mayorista. A diferencia del aviso de medios de
// pago de la tienda, este SÍ se cierra tocando fuera o con Escape, además de
// con "Entendido": obligar a aceptarlo en cada cambio de pestaña sería
// castigar al distribuidor que ya lo leyó.
const IMAGE = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/treegold/marca/balines-oro.png`;

// Texto propio y no el saludo por defecto: ese nombra la marca, y el catálogo
// mayorista no la menciona en ningún lado.
const DISCOUNT_LINK = buildGeneralLink(
  `Hola, quiero comprar balinería desde ${BALINES_SPECIAL_QTY} unidades por referencia. ¿Qué descuento me pueden dar?`
);

// Debe sobrevivir a la transición más larga (la del fondo, 600 ms).
const EXIT_MS = 650;

export default function BalinesNoticeModal() {
  // Mismo patrón que el aviso de medios de pago: transiciones de CSS que
  // arrancan ocultas y se muestran en el siguiente fotograma. Con la librería
  // de animación la salida no llegaba a ejecutarse.
  const [visible, setVisible] = useState(false);
  const [inDom, setInDom] = useState(true);
  // El portal necesita `document.body`, que no existe al renderizar en el
  // servidor: hasta montar en el navegador no se dibuja nada.
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  // Doble requestAnimationFrame: el aviso recién montado tiene que pintarse
  // una vez oculto antes de pasar a visible, o la transición no corre. Con uno
  // solo, el cambio podía llegar antes de ese primer pintado.
  useEffect(() => {
    if (!mounted) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [mounted]);

  useEffect(() => {
    if (!visible) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", onKey);
    const release = lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      release();
    };
  }, [visible]);

  function cerrar() {
    setVisible(false);
    setTimeout(() => setInDom(false), EXIT_MS);
  }

  if (!inDom || !mounted) return null;

  // Portal a <body>: la página de mayoristas anima sus tarjetas con
  // `transform`, y un `fixed` dentro de un ancestro con transform se ancla a
  // él en vez de a la pantalla.
  return createPortal(
    <div
      onClick={cerrar}
      className={`fixed inset-0 z-[80] flex items-center justify-center bg-primary/55 px-5 py-8 backdrop-blur-md transition-opacity duration-[600ms] ease-out ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="balines-titulo"
        onClick={(e) => e.stopPropagation()}
        className={`relative flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-[1.125rem] border border-white/25 bg-white/15 p-[3px] shadow-2xl shadow-black/40 ring-1 ring-inset ring-white/10 backdrop-blur-xl transition-[opacity,transform] duration-500 ease-out md:max-w-md ${
          visible
            ? "translate-y-0 scale-100 opacity-100 delay-100"
            : "translate-y-3 scale-95 opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-y-auto rounded-[0.9375rem] bg-background">
          {/* La foto se desvanece con una máscara sobre ella misma, hacia el
              color de la tarjeta que tiene detrás. Antes era un degradado
              encima de un fondo negro, y en el borde se asomaba una línea
              negra de medio píxel. */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-[0.9375rem]">
            <Image
              src={IMAGE}
              alt="Balines dorados sobre mármol negro"
              fill
              priority
              sizes="(max-width: 768px) 384px, 448px"
              className="object-cover [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
            />
          </div>

          <div className="px-6 pb-6 pt-2 text-center">
            <p className="eyebrow mb-3">Balinería e insumos</p>
            <h2 id="balines-titulo" className="font-serif text-2xl leading-tight text-primary">
              Compra mínima de {BALINES_MIN_QTY} unidades
            </h2>
            <p className="mx-auto mt-3 text-[0.8rem] leading-relaxed text-secondary">
              Cada referencia se vende desde {BALINES_MIN_QTY} unidades. Al
              agregarla a tu pedido entran {BALINES_MIN_QTY} de una vez, y desde
              ahí puedes sumar de a una.
            </p>

            <div className="mt-5 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3.5 text-sm text-primary">
              <p className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-accent" />
                <span>
                  <span className="font-medium">Precio especial</span> desde{" "}
                  {BALINES_SPECIAL_QTY} unidades por referencia
                </span>
              </p>
              <p className="mt-1 text-[0.8rem] text-secondary">
                Escríbenos y pide tu descuento.
              </p>
              <a
                href={DISCOUNT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[#1c8a47] underline-offset-4 transition-colors hover:underline"
              >
                <WhatsAppIcon className="h-4 w-4" /> Pedir descuento por WhatsApp
              </a>
            </div>

            <button
              ref={closeRef}
              onClick={cerrar}
              className="btn-primary mt-6 w-full py-3"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

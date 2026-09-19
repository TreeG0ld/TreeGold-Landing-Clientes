"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CreditCard } from "lucide-react";

// Aviso de medios de pago. Aparece en CADA carga de la página, a propósito: no
// se guarda que ya se aceptó, ni en sessionStorage ni en localStorage. Navegar
// entre secciones no lo repite (el componente vive en el layout y no se vuelve
// a montar); recargar sí.
const IMAGE = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/treegold/marca/medios-de-pago.png`;

const METHODS = ["Addi", "Sistecrédito", "Débito y crédito"];

// Debe sobrevivir a la transición más larga (la del fondo, 700ms).
const EXIT_MS = 750;

export default function PaymentMethodsModal() {
  // `visible` maneja la transición (entrar y salir); `inDom` retira el nodo
  // solo cuando la salida ya terminó. Las animaciones son transiciones de CSS
  // y no de la librería de animación: con esta última la salida no llegaba a
  // ejecutarse nunca —el aviso desaparecía de golpe— mientras que una
  // transición de CSS la dispara el propio navegador al cambiar la clase.
  const [visible, setVisible] = useState(false);
  const [inDom, setInDom] = useState(true);
  const acceptRef = useRef<HTMLButtonElement>(null);

  // Arranca oculto y se muestra en el siguiente fotograma: una transición de
  // CSS solo corre si el navegador alcanza a pintar el estado inicial antes
  // del cambio. Sin este salto de fotograma, aparecería de golpe.
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    acceptRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function accept() {
    setVisible(false);
    setTimeout(() => setInDom(false), EXIT_MS);
  }

  // El aviso es de aceptación obligatoria: no se cierra con Escape, ni al
  // tocar el fondo, ni tabulando hacia la página de atrás.
  function trapKeys(e: React.KeyboardEvent) {
    if (e.key === "Tab" || e.key === "Escape") e.preventDefault();
  }

  if (!inDom) return null;

  return (
    <div
      onKeyDown={trapKeys}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-primary/55 px-5 py-8 backdrop-blur-md transition-opacity duration-700 ease-out ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="medios-pago-titulo"
        // Sale más rápido que el fondo (500ms contra 700ms): primero se
        // disuelve la tarjeta y después se despeja la tienda. Al entrar lleva
        // un retraso para que el fondo se oscurezca primero.
        className={`flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-[1.125rem] border border-white/25 bg-white/15 p-[3px] shadow-2xl shadow-black/40 ring-1 ring-inset ring-white/10 backdrop-blur-xl transition-[opacity,transform] duration-500 ease-out md:max-w-md ${
          visible
            ? "translate-y-0 scale-100 opacity-100 delay-150"
            : "translate-y-3 scale-90 opacity-0"
        }`}
      >
        {/* Dos capas: el marco de arriba es el vidrio translúcido (deja ver la
            tienda borrosa por detrás) y este de adentro es la tarjeta sólida
            con el contenido. El radio interior es el exterior menos el grosor
            del marco, si no las esquinas no encajan. */}
        <div className="min-h-0 overflow-y-auto rounded-[0.9375rem] bg-background">
          {/* Más alto que la foto (4:3 vs 3:2) con `object-contain`: el negro
              ocupa más sin recortar los globos de los extremos. El fondo de la
              imagen ya es negro, así que no se nota el relleno. */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[0.9375rem] bg-black">
            <Image
              src={IMAGE}
              alt="Addi, Sistecrédito y tarjetas débito y crédito"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-contain"
            />
            {/* Funde la foto con la tarjeta: sin esto queda una línea dura
                entre el negro de la imagen y el fondo crema. Baja 1px de más
                (el contenedor lo recorta) porque con el alto en decimales
                quedaba una fila de píxeles negros sin tapar. */}
            <div className="absolute inset-x-0 -bottom-px h-1/3 bg-gradient-to-t from-background via-background/70 to-transparent" />
          </div>

          <div className="px-6 pb-6 pt-2 text-center">
            <p className="eyebrow mb-3 flex items-center justify-center gap-2">
              <CreditCard className="h-3.5 w-3.5" /> Formas de pago
            </p>
            <h2
              id="medios-pago-titulo"
              className="font-serif text-2xl leading-tight text-primary"
            >
              Llévatela hoy, págala a tu ritmo
            </h2>
            <p className="mx-auto mt-3 text-[0.8rem] leading-relaxed text-secondary">
              Paga a crédito con <span className="text-primary">Addi</span> o{" "}
              <span className="text-primary">Sistecrédito</span>, o con tus
              tarjetas débito y crédito.
            </p>

            <ul className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
              {METHODS.map((m) => (
                <li
                  key={m}
                  className="rounded-full border border-border px-3 py-1 text-[0.7rem] font-medium tracking-wide text-secondary"
                >
                  {m}
                </li>
              ))}
            </ul>

            {/* El foco entra aquí solo para poder aceptar con Enter, pero sin
                anillo visible: es el único botón del aviso, así que el borde
                del navegador no orienta a nadie y ensucia el diseño. */}
            <button
              ref={acceptRef}
              onClick={accept}
              className="btn-primary mt-6 w-full py-3 outline-none focus:outline-none focus-visible:outline-none"
            >
              Entendido, ver la tienda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

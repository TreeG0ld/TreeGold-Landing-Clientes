"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { CreditCard } from "lucide-react";

// Aviso de medios de pago. Aparece en CADA carga de la página, a propósito: no
// se guarda que ya se aceptó, ni en sessionStorage ni en localStorage. Navegar
// entre secciones no lo repite (el componente vive en el layout y no se vuelve
// a montar); recargar sí.
const IMAGE = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/treegold/marca/medios-de-pago.png`;

const METHODS = ["Addi", "Sistecrédito", "Débito y crédito"];

const EASE_IN = [0.16, 1, 0.3, 1] as const;
const EASE_OUT = [0.4, 0, 0.2, 1] as const;

export default function PaymentMethodsModal() {
  // Abierto desde el primer render (también en el del servidor): así el aviso
  // ya viene en el HTML y no se ve la tienda un instante antes de que aparezca.
  const [open, setOpen] = useState(true);
  // El elemento se queda en el DOM hasta que la animación de salida TERMINA.
  // Se hace a mano en vez de con <AnimatePresence> porque ahí la salida no
  // llegaba a ejecutarse: React quitaba el nodo antes y el aviso desaparecía
  // de golpe.
  const [inDom, setInDom] = useState(true);
  const acceptRef = useRef<HTMLButtonElement>(null);

  // Retirarlo por tiempo fijo y no con el aviso de fin de animación de la
  // librería: ese aviso también se dispara cuando una animación es sustituida
  // por otra, y entonces el nodo desaparecía antes de que la salida se viera.
  function accept() {
    setOpen(false);
    setTimeout(() => setInDom(false), 750);
  }

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    acceptRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // El aviso es de aceptación obligatoria: no se cierra con Escape, ni al
  // tocar el fondo, ni tabulando hacia la página de atrás.
  function trapKeys(e: React.KeyboardEvent) {
    if (e.key === "Tab" || e.key === "Escape") e.preventDefault();
  }

  if (!inDom) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: open ? 1 : 0 }}
      // Al irse tarda más que la tarjeta: primero se disuelve el aviso y
      // después se despeja el fondo, así la tienda "vuelve a enfocarse".
      transition={{ duration: open ? 0.4 : 0.65, ease: EASE_IN }}
      onKeyDown={trapKeys}
      // Libera los clics apenas empieza la salida: la tienda queda utilizable
      // sin esperar a que termine la animación.
      style={{ pointerEvents: open ? "auto" : "none" }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/55 px-5 py-8 backdrop-blur-md"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="medios-pago-titulo"
        // Solo opacidad, escala y desplazamiento: nada de `filter: blur`, que
        // sobre esta tarjeta (que ya lleva desenfoque de fondo) hacía que la
        // salida saltara en vez de animarse.
        initial={{ opacity: 0, y: 32, scale: 0.92 }}
        animate={
          open
            ? {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.7, delay: 0.12, ease: EASE_IN },
              }
            : {
                opacity: 0,
                y: 12,
                scale: 0.9,
                transition: { duration: 0.5, ease: EASE_OUT },
              }
        }
        className="flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-[1.125rem] border border-white/25 bg-white/15 p-[3px] shadow-2xl shadow-black/40 ring-1 ring-inset ring-white/10 backdrop-blur-xl md:max-w-md"
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
      </motion.div>
    </motion.div>
  );
}

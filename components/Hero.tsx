"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ChevronDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Banner oficial de marca (logo + eslogan integrados en la imagen), subido a
// treegold/marca/ (carpeta exenta del recorte de catálogo en imageLoader).
// Como la imagen ya trae el texto, el hero no superpone título: solo botones.
const BANNER =
  "https://res.cloudinary.com/dkab59i18/image/upload/v1784118180/treegold/marca/hero-banner-v2.png";

// Variante para celular: el banner es muy panorámico (2.34:1); en un viewport
// retrato, object-cover SIEMPRE muestra el 100% del alto (ahí es donde vive
// el eslogan "TÚ MERECES BRILLAR", a ~85% hacia abajo), dejándolo pegado justo
// donde van los botones. Esta variante recorta la columna central (logo +
// texto, con margen para que el eslogan quepa completo) y le agrega lienzo
// negro extra abajo (c_pad) para "subir" el texto al ~55% del alto: así
// siempre queda por encima de los botones, sin importar el tamaño del
// teléfono. Se sirve tal cual (unoptimized) porque ya trae su propio recorte,
// formato y ancho — pasarla por el loader genérico duplicaría/desordenaría
// las transformaciones.
const BANNER_MOBILE =
  "https://res.cloudinary.com/dkab59i18/image/upload/c_crop,g_center,w_3600,h_3280/c_pad,g_north,w_3600,h_4500,b_black/f_auto,q_auto:good,w_1200,c_limit/v1784118180/treegold/marca/hero-banner-v2.png";

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-img", { scale: 1.06, opacity: 0, duration: 1.6, ease: "power2.out" })
        .from(
          ".hero-fade",
          { y: 24, opacity: 0, duration: 0.9, stagger: 0.15 },
          "-=0.8"
        )
        .from(".hero-scroll", { opacity: 0, duration: 0.8 }, "-=0.3");
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-[70svh] flex-col items-center justify-center gap-10 overflow-hidden bg-black px-5 pb-20 pt-24 md:min-h-[80svh]"
    >
      {/* El banner como fondo completo */}
      <div className="hero-img absolute inset-0 z-0">
        {/* Celular: composición recortada + con espacio extra abajo (ver
            BANNER_MOBILE) para que el eslogan no quede tapado por los botones. */}
        <Image
          src={BANNER_MOBILE}
          alt="TreeGold Joyería — Tú mereces brillar"
          fill
          priority
          unoptimized
          className="object-contain object-top md:hidden"
        />
        {/* Escritorio/tablet: banner completo, sin recortar. */}
        <Image
          src={BANNER}
          alt="TreeGold Joyería — Tú mereces brillar"
          fill
          priority
          sizes="100vw"
          className="hidden object-cover md:block"
        />
        {/* Oscurecemos un poco la parte inferior para asegurar que los botones se lean bien */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      <div className="hero-fade relative z-10 mt-auto flex w-full max-w-md flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/coleccion" className="btn-primary w-full text-center sm:w-auto">
          Explorar colección
        </Link>
        <Link
          href="/historia"
          className="w-full rounded-full border border-white/40 bg-black/40 px-7 py-3.5 text-center text-sm font-medium tracking-wide text-white backdrop-blur-sm transition-all duration-300 ease-luxe hover:border-white hover:bg-white/20 sm:w-auto"
        >
          Nuestra historia
        </Link>
      </div>

      <div className="hero-scroll absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/80">
        <ChevronDown className="h-7 w-7 animate-float-slow" />
      </div>
    </section>
  );
}

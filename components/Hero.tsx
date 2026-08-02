"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ChevronDown } from "lucide-react";
import imageLoader from "@/lib/imageLoader";

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
// teléfono. Se sirve tal cual, sin pasar por el loader ni por srcset, porque
// ya trae su propio recorte, formato y ancho — pasarla por el loader genérico
// duplicaría/desordenaría las transformaciones.
const BANNER_MOBILE =
  "https://res.cloudinary.com/dkab59i18/image/upload/c_crop,g_center,w_3600,h_3280/c_pad,g_north,w_3600,h_4500,b_black/f_auto,q_auto:good,w_1200,c_limit/v1784118180/treegold/marca/hero-banner-v2.png";

// Tamaño real del archivo que devuelve BANNER_MOBILE: el c_pad lo deja en
// 3600x4500 y el w_1200,c_limit final lo reduce a 1200x1500. Lo declaramos en
// el <img> para que el navegador conozca la relación de aspecto y no haya CLS.
const BANNER_MOBILE_W = 1200;
const BANNER_MOBILE_H = 1500;

// Anchos del srcset de escritorio (los mismos tramos que generaba next/image).
// Construimos las URLs con el MISMO loader del sitio (lib/imageLoader.ts) en
// vez de escribir las transformaciones a mano: así el banner se sigue sirviendo
// en WebP/AVIF al ancho justo (f_auto,q_auto:good,w_N,c_limit) y las reglas de
// Cloudinary siguen viviendo en un solo archivo, aunque esta imagen ya no pase
// por el componente <Image>. Tope en 2560: es el recurso LCP de la home y a
// partir de ahí solo se gana peso (c_limit tampoco agranda más que el original).
const DESKTOP_WIDTHS = [828, 1200, 1600, 1920, 2560];
const BANNER_SRCSET = DESKTOP_WIDTHS.map(
  (w) => `${imageLoader({ src: BANNER, width: w })} ${w}w`
).join(", ");

// Srcset de celular: mismas transformaciones de recorte/relleno que
// BANNER_MOBILE (c_crop + c_pad), solo variando el ancho final del último
// paso (w_N,c_limit). Antes se servía un único archivo de 1200px a todos los
// teléfonos; con esto un teléfono de gama baja (~480px de viewport) pide un
// archivo de ~600px en vez de 1200, y uno grande pide hasta 1600.
const MOBILE_WIDTHS = [600, 900, 1200, 1600];
const BANNER_MOBILE_SRCSET = MOBILE_WIDTHS.map(
  (w) =>
    `https://res.cloudinary.com/dkab59i18/image/upload/c_crop,g_center,w_3600,h_3280/c_pad,g_north,w_3600,h_4500,b_black/f_auto,q_auto:good,w_${w},c_limit/v1784118180/treegold/marca/hero-banner-v2.png ${w}w`
).join(", ");

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Nada de esto debe dejar el banner invisible si algo sale mal: por
      // eso los elementos NO empiezan ocultos por CSS (nada de opacity:0 por
      // defecto en el markup) — quedan visibles de fábrica, y es GSAP quien
      // decide animarlos. Si el usuario prefiere menos movimiento, o si esta
      // función nunca llega a ejecutarse (JS lento, bloqueado, error), lo
      // peor que pasa es que no hay animación: el banner SIGUE viéndose.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
      {/* El banner ya trae el nombre de la marca como texto incrustado en la
          imagen, pero eso no cuenta como encabezado para lectores de pantalla
          ni para SEO: sin esto, la home no tenía ningún <h1> y su esquema de
          encabezados empezaba en <h2>. sr-only lo saca de la vista sin tocar
          el diseño. */}
      <h1 className="sr-only">{"TreeGold Joyería — Tú mereces brillar"}</h1>

      {/* El banner como fondo completo */}
      <div className="hero-img absolute inset-0 z-0">
        {/* Por qué <picture> y no dos <Image> de next/image:
            antes había uno para celular y otro para escritorio, cada uno con
            `priority`, y `priority` inyecta un <link rel="preload"> en el
            <head>. Ese preload no sabe nada de `md:hidden` / `hidden md:block`
            (son clases CSS, no medios), así que TODO visitante descargaba las
            dos variantes del banner y duplicaba el peso del recurso LCP.
            Con <picture>, la elección la hace el propio navegador con el
            atributo `media` — y el preload scanner lo respeta —, de modo que
            se descarga UNA sola imagen por visitante. Se pierde el componente
            <Image>, pero no lo que aportaba: el srcset responsive se genera
            arriba con el mismo loader, y `fetchPriority="high"` sobre un <img>
            que está al principio del HTML da la misma prioridad de red que el
            preload que ponía `priority`.
            (La alternativa de mantener los dos <Image> y añadir un
            <link rel="preload" media=...> a mano se descartó: obliga a
            mantener sincronizadas a mano la URL del preload, el breakpoint y
            el srcset que genera Next, y sigue enviando al DOM dos <img> —el
            oculto se descarta, pero el HTML y el trabajo de layout se pagan
            igual.) */}
        <picture className="contents">
          {/* Escritorio/tablet (>=768px = breakpoint `md` de Tailwind): banner
              completo, sin recortar. */}
          <source media="(min-width: 768px)" srcSet={BANNER_SRCSET} sizes="100vw" />
          {/* Celular (fallback del <picture>): composición recortada + con
              espacio extra abajo (ver BANNER_MOBILE) para que el eslogan no
              quede tapado por los botones. Va sin srcset porque la URL ya trae
              sus propias transformaciones y su ancho fijo.
              width/height son los del archivo de celular; en escritorio la
              proporción real es otra, pero da igual: el CSS fija las dos
              dimensiones (absolute inset-0 h-full w-full), así que el ratio
              intrínseco nunca decide el layout y no puede haber CLS. */}
          <img
            src={BANNER_MOBILE}
            srcSet={BANNER_MOBILE_SRCSET}
            sizes="100vw"
            alt="TreeGold Joyería — Tú mereces brillar"
            width={BANNER_MOBILE_W}
            height={BANNER_MOBILE_H}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain object-top md:object-cover md:object-center"
          />
        </picture>
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

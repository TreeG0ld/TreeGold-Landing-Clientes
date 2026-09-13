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

// Variante para celular: foto propia (retrato, 1086x1448), compuesta a mano
// para ese formato — ya trae el logo/eslogan arriba con espacio de sobra y
// las piezas más abajo, así que no hace falta ningún recorte ni relleno
// artificial (a diferencia del banner de escritorio, que es panorámico).
const BANNER_MOBILE =
  "https://res.cloudinary.com/dkab59i18/image/upload/v1789257686/treegold/marca/hero-banner-movil.png";
const BANNER_MOBILE_W = 1086;
const BANNER_MOBILE_H = 1448;

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

// Srcset de celular: mismo loader (esta foto también vive en treegold/marca/,
// así que sale sin recorte de catálogo, solo f_auto,q_auto:good,w_N,c_limit).
// c_limit nunca agranda más allá del original (1086px), así que los tramos
// mayores simplemente sirven el archivo tal cual.
const MOBILE_WIDTHS = [480, 750, 1086];
const BANNER_MOBILE_SRCSET = MOBILE_WIDTHS.map(
  (w) => `${imageLoader({ src: BANNER_MOBILE, width: w })} ${w}w`
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
      // El alto NO depende del viewport (min-h): se fija a la proporción
      // exacta de cada foto (retrato 1086x1448 en celular, panorámica
      // 7672x3280 en escritorio), así el rectángulo siempre tiene la misma
      // forma que la imagen y esta lo llena sin recortar nada ni dejar
      // franjas negras de relleno.
      className="relative flex aspect-[1086/1448] flex-col items-center justify-center gap-10 overflow-hidden bg-black px-5 pb-20 pt-24 md:aspect-[7672/3280]"
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
          {/* Celular (fallback del <picture>): foto propia en formato retrato
              (ver BANNER_MOBILE), sin recorte ni relleno — la sección tiene
              la misma proporción exacta que el archivo.
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
            // object-contain en escritorio (no cover): el banner tiene marcos
            // decorativos pegados casi al borde de la imagen — cualquier
            // recorte por aspect-ratio los corta. Con contain se ve SIEMPRE
            // completo; como el fondo de la sección y el de la imagen son el
            // mismo negro, el espacio sobrante (si lo hay) es invisible.
            className="absolute inset-0 h-full w-full object-contain object-top md:object-center"
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

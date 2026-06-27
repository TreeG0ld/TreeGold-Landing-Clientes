"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ChevronDown } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const titleLines = ["Diseños en", "oro laminado", "hechos a mano"];

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-img", { scale: 1.18, duration: 1.8, ease: "power2.out" })
        .from(
          ".hero-word",
          { yPercent: 120, opacity: 0, duration: 1, stagger: 0.12 },
          "-=1.3"
        )
        .from(
          ".hero-fade",
          { y: 24, opacity: 0, duration: 0.9, stagger: 0.15 },
          "-=0.6"
        )
        .from(".hero-scroll", { opacity: 0, duration: 0.8 }, "-=0.3");

      // Parallax suave del fondo al hacer scroll
      gsap.to(".hero-img", {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="relative flex h-[80svh] min-h-[520px] max-h-[820px] items-center justify-center overflow-hidden"
    >
      {/* Background image */}
      <div className="hero-img absolute inset-0 -z-10 will-change-transform">
        <Image
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=80"
          alt="Joyería TreeGold"
          fill
          priority
          quality={68}
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
      </div>

      <div className="mx-auto max-w-5xl px-5 text-center text-white">
        <p className="hero-fade eyebrow mb-5 text-white/80">
          Joyería de autor · Oro laminado
        </p>

        <h1 className="text-[clamp(2.8rem,12vw,7rem)] font-medium leading-[1.04]">
          {titleLines.map((line) => (
            <span
              key={line}
              className="block overflow-hidden pb-[0.14em] -mb-[0.12em]"
            >
              <span className="hero-word inline-block px-[0.04em]">{line}</span>
            </span>
          ))}
        </h1>

        <p className="hero-fade mx-auto mt-6 max-w-md text-base text-white/85 md:text-lg">
          Piezas hechas a mano, con acabados que cuidan cada detalle.
        </p>

        <div className="hero-fade mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/coleccion" className="btn-primary w-full sm:w-auto">
            Explorar colección
          </Link>
          <Link
            href="/historia"
            className="w-full rounded-full border border-white/40 px-7 py-3.5 text-sm font-medium tracking-wide text-white transition-all duration-300 ease-luxe hover:border-white hover:bg-white/10 sm:w-auto"
          >
            Nuestra historia
          </Link>
        </div>
      </div>

      <div className="hero-scroll absolute bottom-7 left-1/2 -translate-x-1/2 text-white/70">
        <ChevronDown className="h-7 w-7 animate-float-slow" />
      </div>
    </section>
  );
}

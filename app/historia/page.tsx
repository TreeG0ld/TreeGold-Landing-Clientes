import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/anim/Reveal";
import StatsCounter from "@/components/StatsCounter";

export const metadata: Metadata = {
  title: "Historia",
  description:
    "La historia de Joyería TreeGold: oficio, artesanía y piezas hechas a mano en oro laminado.",
};

const values = [
  { title: "Materiales", text: "Trabajamos con oro laminado y plata 925." },
  { title: "Hecho a mano", text: "Cada pieza se elabora a mano, sin producción en serie." },
  { title: "A tu medida", text: "Diseñamos piezas personalizadas según lo que necesites." },
];

export default function HistoriaPage() {
  return (
    <div className="pt-24 md:pt-32">
      {/* Intro */}
      <section className="mx-auto max-w-4xl px-5 py-16 text-center md:px-8">
        <Reveal childSelector=".rv" stagger={0.12}>
          <p className="rv eyebrow mb-4">Nuestra historia</p>
          <h1 className="rv text-5xl leading-tight md:text-7xl">
            Tradición convertida en joya
          </h1>
          <p className="rv mx-auto mt-6 max-w-2xl text-lg text-secondary leading-relaxed">
            TreeGold nació del amor por el oficio joyero. Desde nuestro taller
            creamos piezas hechas a mano, en oro laminado y plata 925, con
            diseños que combinan técnicas tradicionales y un estilo contemporáneo.
          </p>
        </Reveal>
      </section>

      {/* Imagen grande */}
      <Reveal>
        <div className="relative mx-auto aspect-[16/9] max-w-6xl overflow-hidden md:rounded-3xl">
          <Image
            src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1920&q=80"
            alt="Taller TreeGold"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </Reveal>

      {/* Valores */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <Reveal childSelector=".rv" stagger={0.14}>
          <div className="grid gap-10 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rv">
                <div className="mb-4 h-px w-12 bg-accent" />
                <h3 className="text-2xl">{v.title}</h3>
                <p className="mt-3 text-secondary leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Stats */}
      <section className="border-y border-border py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <StatsCounter />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-5 py-24 text-center">
        <Reveal childSelector=".rv" stagger={0.12}>
          <h2 className="rv text-4xl md:text-5xl">¿Hacemos tu joya juntos?</h2>
          <p className="rv mx-auto mt-5 max-w-lg text-secondary">
            Cuéntanos qué tienes en mente y lo convertimos en una pieza única.
          </p>
          <div className="rv mt-8">
            <Link href="/contacto" className="btn-primary">
              Contáctanos
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

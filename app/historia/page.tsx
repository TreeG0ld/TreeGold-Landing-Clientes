import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/anim/Reveal";
import StatsCounter from "@/components/StatsCounter";
import { site } from "@/lib/site";
import { getActiveProductCount } from "@/lib/catalog";

// Esta página usa su propia serif (distinta del Marcellus global) para darle
// un aire más editorial a la historia de la marca.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Regenera junto con el resto del catálogo (mismo patrón que la home).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Historia",
  description:
    "La historia de Joyería TreeGold: 8 años ofreciendo joyería en oro laminado y plata 925 en Medellín, con atención directa por WhatsApp.",
  alternates: { canonical: "/historia" },
};

// TreeGold es tienda/distribuidora, no taller: no fabrica ni diseña las
// piezas a medida. Este contenido evita esas afirmaciones a propósito.
const values = [
  { title: "Materiales", text: "Piezas en oro laminado y plata 925, seleccionadas por su durabilidad." },
  { title: "Trayectoria", text: `${site.yearsInMarket} años ofreciendo joyería de calidad en Medellín.` },
  { title: "Atención cercana", text: "Te acompañamos por WhatsApp para encontrar la pieza ideal." },
];

export default async function HistoriaPage() {
  const productCount = await getActiveProductCount();
  // Redondeado hacia abajo a la centena: un número real, pero que no queda
  // desactualizado apenas se agregue o quite un producto del catálogo.
  const roundedProductCount = Math.floor(productCount / 100) * 100;

  const stats = [
    { value: site.yearsInMarket, suffix: "", label: "Años en el mercado" },
    { value: roundedProductCount, suffix: "+", label: "Piezas en catálogo" },
    { value: 18, suffix: "k", label: "Oro laminado" },
  ];

  return (
    <div className="pt-24 md:pt-32">
      {/* Intro */}
      <section className="mx-auto max-w-4xl px-5 py-16 text-center md:px-8">
        <Reveal childSelector=".rv" stagger={0.12}>
          <p className="rv eyebrow mb-4">Nuestra historia</p>
          <h1 className={`rv text-5xl leading-tight md:text-7xl ${playfair.className}`}>
            {site.yearsInMarket} años haciéndote brillar
          </h1>
          <p className="rv mx-auto mt-6 max-w-2xl text-lg text-secondary leading-relaxed">
            TreeGold nació hace {site.yearsInMarket} años con un propósito simple: acercarte
            joyería en oro laminado y plata 925 que se vea y se sienta especial. Seleccionamos
            cada pieza de nuestro catálogo de anillos, cadenas, aretes, dijes y pulseras
            pensando en la calidad y en que te dure.
          </p>
        </Reveal>
      </section>

      {/* Imagen grande */}
      <Reveal>
        <div className="relative mx-auto aspect-[16/9] max-w-6xl overflow-hidden md:rounded-3xl">
          <Image
            src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1920&q=80"
            alt="Joyería TreeGold"
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
                <h3 className={`text-2xl ${playfair.className}`}>{v.title}</h3>
                <p className="mt-3 text-secondary leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Stats */}
      <section className="border-y border-border py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <StatsCounter stats={stats} />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-5 py-24 text-center">
        <Reveal childSelector=".rv" stagger={0.12}>
          <h2 className={`rv text-4xl md:text-5xl ${playfair.className}`}>¿Buscas tu próxima joya?</h2>
          <p className="rv mx-auto mt-5 max-w-lg text-secondary">
            Escríbenos por WhatsApp y te ayudamos a encontrar la pieza perfecta para ti.
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

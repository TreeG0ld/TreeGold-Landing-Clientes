import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/Hero";
import Reveal from "@/components/anim/Reveal";
import ProductCard from "@/components/ProductCard";
import CategoryCarousel from "@/components/CategoryCarousel";
import ArtisanCarousel from "@/components/ArtisanCarousel";
import { getAllCategories, getFeatured, getPromos } from "@/lib/catalog";

// Regenera la página estática cada hora (catálogo fresco sin sacrificar velocidad).
export const revalidate = 3600;

export default async function Home() {
  const [categories, featured, promos] = await Promise.all([
    getAllCategories(),
    getFeatured(8),
    getPromos(8),
  ]);

  return (
    <>
      <Hero />

      {/* Promociones (se activan por producto desde /admin) */}
      {promos.length > 0 && (
        <section id="promociones" className="scroll-mt-24 bg-accent/10 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <Reveal>
              <div className="mb-10 text-center">
                <p className="eyebrow mb-3">Por tiempo limitado</p>
                <h2 className="text-4xl md:text-5xl">Promociones</h2>
              </div>
            </Reveal>

            <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
              {promos.map((p, i) => (
                <ProductCard key={p.slug} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categorías */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <Reveal childSelector=".rv" stagger={0.12}>
          <div className="rv mb-12 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow mb-3">Nuestras colecciones</p>
              <h2 className="text-4xl md:text-5xl">Encuentra tu pieza</h2>
            </div>
            <Link
              href="/coleccion"
              className="group inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-accent"
            >
              Ver todo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="rv">
            <CategoryCarousel categories={categories} />
          </div>
        </Reveal>
      </section>

      {/* Destacados */}
      <section className="bg-muted/40 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal>
            <div className="mb-12 text-center">
              <p className="eyebrow mb-3">Selección del mes</p>
              <h2 className="text-4xl md:text-5xl">Piezas destacadas</h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Historia / Artesanía */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal y={50}>
            <ArtisanCarousel />
          </Reveal>

          <Reveal childSelector=".rv" stagger={0.14} y={30}>
            <p className="rv eyebrow mb-4">Nuestra historia</p>
            <h2 className="rv text-4xl leading-tight md:text-5xl">
              Lorem ipsum dolor sit amet
            </h2>
            <p className="rv mt-6 text-secondary leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula.
            </p>
            <p className="rv mt-4 text-secondary leading-relaxed">
              Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor.
            </p>
            <div className="rv mt-8">
              <Link href="/historia" className="btn-outline">
                Conoce nuestra historia
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA final. "-mb-24" cancela el margen del Footer (mt-24) para que no
          quede una franja del fondo claro de la página entre esta sección
          oscura y el Footer (también oscuro); el border-b es la línea dorada
          sutil que separa ambos. */}
      <section className="relative -mb-24 overflow-hidden border-b border-accent-soft/30 bg-primary py-24 text-center text-on-primary md:py-32">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal childSelector=".rv" stagger={0.12}>
            <p className="rv eyebrow mb-4 text-accent-soft">¿Tienes una idea en mente?</p>
            <h2 className="rv text-4xl text-white md:text-6xl">
              Diseñamos tu joya a medida
            </h2>
            <p className="rv mx-auto mt-6 max-w-xl text-white/75">
              Cuéntanos qué imaginas y la convertimos en una pieza real. Escríbenos
              por WhatsApp y empecemos a crear juntos.
            </p>
            <div className="rv mt-9">
              <Link href="/contacto" className="btn-primary bg-accent hover:bg-accent-soft">
                Hablemos de tu pieza
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

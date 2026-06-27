import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/Hero";
import Reveal from "@/components/anim/Reveal";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import StatsCounter from "@/components/StatsCounter";
import { getAllCategories, getFeatured } from "@/lib/catalog";

// Regenera la página estática cada hora (catálogo fresco sin sacrificar velocidad).
export const revalidate = 3600;

export default async function Home() {
  const [categories, featured] = await Promise.all([
    getAllCategories(),
    getFeatured(8),
  ]);

  return (
    <>
      <Hero />

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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <CategoryCard
                key={c.slug}
                category={c}
                className="rv aspect-[3/4]"
              />
            ))}
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
            {featured.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Historia / Artesanía */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal y={50}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
              <Image
                src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=80"
                alt="Artesanía TreeGold"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal childSelector=".rv" stagger={0.14} y={30}>
            <p className="rv eyebrow mb-4">Hechas a mano</p>
            <h2 className="rv text-4xl leading-tight md:text-5xl">
              El arte detrás de cada joya
            </h2>
            <p className="rv mt-6 text-secondary leading-relaxed">
              En TreeGold cada pieza se hace a mano en nuestro taller, en oro
              laminado y plata 925, cuidando cada detalle del diseño y el
              acabado.
            </p>
            <p className="rv mt-4 text-secondary leading-relaxed">
              No producimos en serie: cada pieza pasa por nuestros joyeros antes
              de llegar a ti.
            </p>
            <div className="rv mt-8">
              <Link href="/historia" className="btn-outline">
                Conoce nuestra historia
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-background py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <StatsCounter />
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden bg-primary py-24 text-center text-on-primary md:py-32">
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

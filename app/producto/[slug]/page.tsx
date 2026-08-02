import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Reveal from "@/components/anim/Reveal";
import ProductDetail from "@/components/ProductDetail";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug, getRelated, getFeatured, getPromos } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";

type Params = { params: Promise<{ slug: string }> };

// ISR: la página se genera bajo demanda y queda cacheada (visitas siguientes
// instantáneas), regenerándose cada hora para reflejar cambios de catálogo.
export const revalidate = 3600;

// No pre-generamos las 660 fichas en el build (tardaría demasiado), pero sí
// las más visitadas: las de promociones/destacadas de la home Y la primera
// página completa del catálogo (orden por defecto), que es de donde sale la
// gran mayoría de los clics reales. Su PRIMERA visita ya sale de caché en vez
// de esperar a la base de datos — antes esto cubría 16 productos, ahora hasta
// ~48 (24 de la primera página de /coleccion + hasta 24 en promoción). El
// resto se sigue generando bajo demanda con ISR.
export async function generateStaticParams() {
  try {
    const [promos, featured] = await Promise.all([getPromos(24), getFeatured(24)]);
    const slugs = new Set([...promos, ...featured].map((p) => p.slug));
    return [...slugs].map((slug) => ({ slug }));
  } catch {
    // Si la base de datos no responde durante el build, seguimos generando
    // todo bajo demanda en vez de tumbar el despliegue.
    return [];
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      title: `${product.name} · ${formatCOP(product.price)}`,
      description: product.description,
      type: "website",
      images: [{ url: product.images[0], alt: product.name }],
    },
  };
}

// Los relacionados se consultan aparte y se transmiten (streaming) cuando
// estén listos: la ficha del producto —lo que el cliente vino a ver— se pinta
// sin esperar a esta segunda consulta.
async function RelatedProducts({ slug }: { slug: string }) {
  const related = await getRelated(slug, 4);
  if (related.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
      <Reveal>
        <h2 className="mb-10 text-center text-3xl md:text-4xl">
          También te puede gustar
        </h2>
      </Reveal>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {related.map((p, i) => (
          <ProductCard key={p.slug} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}

// Reserva el alto de la sección mientras llega, para que el pie de página no
// dé un salto cuando entren las tarjetas.
function RelatedSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
      <div className="skeleton mx-auto mb-10 h-9 w-72 max-w-full" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[4/5] w-full rounded-2xl" />
            <div className="mt-4 space-y-2 px-1">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // JSON-LD para rich results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    material: product.material,
    offers: {
      "@type": "Offer",
      priceCurrency: "COP",
      price: product.price,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escapamos "<" para que un nombre/descripción de producto con
        // "</script>" no cierre la etiqueta e inyecte HTML/JS (XSS).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProductDetail product={product} />

      <Suspense fallback={<RelatedSkeleton />}>
        <RelatedProducts slug={slug} />
      </Suspense>
    </>
  );
}

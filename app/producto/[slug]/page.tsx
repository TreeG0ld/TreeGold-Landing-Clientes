import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Reveal from "@/components/anim/Reveal";
import ProductDetail from "@/components/ProductDetail";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug, getRelated } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";

type Params = { params: Promise<{ slug: string }> };

// ISR: la página se genera bajo demanda y queda cacheada (visitas siguientes
// instantáneas), regenerándose cada hora para reflejar cambios de catálogo.
export const revalidate = 3600;

// Lista vacía: no pre-generamos las 660 en el build, pero habilita el cacheo
// ISR por slug (la ruta deja de ser 100% dinámica).
export async function generateStaticParams() {
  return [];
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

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelated(product.category, product.slug, 4);

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} />

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
          <Reveal>
            <h2 className="mb-10 text-center text-3xl md:text-4xl">
              También te puede gustar
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

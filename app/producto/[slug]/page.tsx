import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Reveal from "@/components/anim/Reveal";
import ProductDetail from "@/components/ProductDetail";
import ProductCard from "@/components/ProductCard";
import { products, getProduct, getByCategory } from "@/lib/products";
import { formatCOP } from "@/lib/format";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} · ${formatCOP(product.price)}`,
      description: product.description,
      images: [product.images[0]],
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = getByCategory(product.category)
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

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

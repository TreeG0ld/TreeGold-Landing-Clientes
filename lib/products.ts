// Datos de ejemplo. Se reemplazarán por consultas a la base de datos más adelante.

export type Category = {
  slug: string;
  name: string;
  description: string;
  image: string;
};

export type Product = {
  slug: string;
  name: string;
  category: string; // category slug
  price: number; // COP, referencial
  material: string;
  gemstone?: string;
  description: string;
  details: string[];
  sizes?: string[];
  images: string[];
  featured?: boolean;
};

export const categories: Category[] = [
  {
    slug: "anillos",
    name: "Anillos",
    description: "Solitarios, alianzas y diseños de autor.",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    slug: "collares",
    name: "Collares",
    description: "Cadenas y dijes en oro y piedras preciosas.",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    slug: "aretes",
    name: "Aretes",
    description: "Desde topos minimalistas hasta piezas statement.",
    image:
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=1200&q=80",
  },
  {
    slug: "pulseras",
    name: "Pulseras",
    description: "Brazaletes y tennis para cada ocasión.",
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1200&q=80",
  },
];

export const products: Product[] = [
  {
    slug: "anillo-solitario-aurora",
    name: "Solitario Aurora",
    category: "anillos",
    price: 4200000,
    material: "Oro 18k",
    gemstone: "Diamante 0.5ct",
    description:
      "Un solitario atemporal con diamante talla brillante engastado en seis garras. La pieza definitiva para el sí.",
    details: ["Oro amarillo 18k", "Diamante 0.5ct VS", "Engaste de 6 garras", "Hecho a mano"],
    sizes: ["5", "6", "7", "8", "9"],
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
  },
  {
    slug: "collar-cascada-esmeralda",
    name: "Cascada Esmeralda",
    category: "collares",
    price: 6800000,
    material: "Oro blanco 18k",
    gemstone: "Esmeralda colombiana",
    description:
      "Esmeralda colombiana suspendida en una cascada de oro blanco. Elegancia que captura la luz.",
    details: ["Oro blanco 18k", "Esmeralda 1.2ct", "Cadena 45cm", "Certificado de origen"],
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
  },
  {
    slug: "aretes-gota-luna",
    name: "Gota de Luna",
    category: "aretes",
    price: 2300000,
    material: "Oro 18k",
    gemstone: "Perla cultivada",
    description:
      "Aretes colgantes con perla cultivada y un sutil acento de oro pulido. Movimiento y luz en cada paso.",
    details: ["Oro amarillo 18k", "Perla cultivada 8mm", "Cierre de seguridad"],
    images: [
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
  },
  {
    slug: "pulsera-tennis-luz",
    name: "Tennis Luz",
    category: "pulseras",
    price: 5400000,
    material: "Oro blanco 18k",
    gemstone: "Diamantes",
    description:
      "Una línea continua de diamantes en oro blanco. El clásico que nunca pasa de moda.",
    details: ["Oro blanco 18k", "Diamantes 2ct totales", "Largo 18cm", "Cierre doble seguro"],
    images: [
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=1200&q=80",
    ],
    featured: true,
  },
  {
    slug: "anillo-alianza-eterna",
    name: "Alianza Eterna",
    category: "anillos",
    price: 2900000,
    material: "Oro 18k",
    description:
      "Alianza de perfil cómodo con acabado satinado. Pensada para llevarse toda la vida.",
    details: ["Oro amarillo 18k", "Perfil confort 4mm", "Acabado satinado"],
    sizes: ["5", "6", "7", "8", "9", "10"],
    images: [
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    slug: "collar-hilo-oro",
    name: "Hilo de Oro",
    category: "collares",
    price: 1800000,
    material: "Oro 18k",
    description:
      "Una cadena finísima que se lleva sola o en capas. Minimalismo en estado puro.",
    details: ["Oro amarillo 18k", "Cadena 42cm", "Extensión 3cm"],
    images: [
      "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    slug: "aretes-topo-sol",
    name: "Topo Sol",
    category: "aretes",
    price: 950000,
    material: "Oro 18k",
    description:
      "Topos diminutos con destello de oro pulido. El detalle perfecto para el día a día.",
    details: ["Oro amarillo 18k", "Cierre a presión", "Diámetro 5mm"],
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    slug: "pulsera-cadena-roma",
    name: "Cadena Roma",
    category: "pulseras",
    price: 2100000,
    material: "Oro 18k",
    description:
      "Eslabones pulidos de inspiración clásica. Presencia sin esfuerzo en la muñeca.",
    details: ["Oro amarillo 18k", "Largo 19cm", "Cierre mosquetón"],
    images: [
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1200&q=80",
    ],
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getFeatured(): Product[] {
  return products.filter((p) => p.featured);
}

export function getByCategory(slug: string): Product[] {
  return products.filter((p) => p.category === slug);
}

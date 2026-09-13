// Tipos del catálogo. Los datos reales viven en la base de datos y se leen
// a través de lib/catalog.ts — este archivo ya no exporta datos de ejemplo
// (antes tenía productos ficticios con fotos de Unsplash y texto de relleno
// como "Hecho a mano" / "diseños de autor", que no aplican: TreeGold vende,
// no fabrica ni diseña las piezas).

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
  originalPrice?: number;
  isPromo?: boolean;
  material: string;
  gemstone?: string;
  description: string;
  details: string[];
  sizes?: string[];
  size?: string; // Medida visible del producto: "40 cm" (cadenas), "Talla 7" (anillos)...
  images: string[];
  featured?: boolean;
};

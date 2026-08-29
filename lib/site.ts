// Configuración central de la tienda (luego se moverá a la base de datos).
export const site = {
  name: "TreeGold",
  fullName: "Joyería TreeGold",
  // URL pública del sitio (para SEO: OpenGraph, sitemap, canónicos).
  // En producción define NEXT_PUBLIC_SITE_URL con tu dominio real.
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  tagline: "Joyería de autor en oro laminado y plata 925",
  // Eslogan corto de marca: acompaña al logo (Hero, footer).
  slogan: "Tú mereces brillar",
  // ~155-160 caracteres: el máximo que Google suele mostrar en el resultado
  // de búsqueda sin truncar. Se usa como meta description global y en
  // OpenGraph/Twitter (app/layout.tsx).
  description:
    "Joyería de autor en oro laminado y plata 925, hecha a mano en Medellín. Anillos, cadenas, aretes, dijes y pulseras. Compra por WhatsApp, envíos a toda Colombia.",
  whatsapp: "573017780779",
  whatsappDisplay: "+57 301 778 0779",
  instagram: "https://www.instagram.com/joyeria.treegold18k/",
  email: "Juangonzalez.treegold@gmail.com",
  address: "Calle 49 # 7 - 28, Buenos Aires, Medellín",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Calle+49+%237+-+28+Buenos+Aires+Medellin",
  city: "Colombia",
  currency: "COP",
};

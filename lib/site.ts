// Configuración central de la tienda (luego se moverá a la base de datos).
export const site = {
  name: "TreeGold",
  fullName: "Joyería TreeGold",
  // URL pública del sitio (para SEO: OpenGraph, sitemap, canónicos).
  // En producción define NEXT_PUBLIC_SITE_URL con tu dominio real.
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  // TreeGold es tienda/distribuidora, no taller: vende joyería en oro
  // laminado y plata 925, no la fabrica ni la diseña a medida. "de autor" y
  // "hecho a mano" quedan fuera de todo el copy del sitio por esa razón.
  // Solo se usa para armar el título de la página de inicio (ver
  // app/layout.tsx). Dice "18k" y no repite "Joyería" —que ya está en
  // fullName— para no gastar caracteres: Google corta el título alrededor de
  // los 60 y todo lo que se repite es espacio perdido.
  tagline: "Oro laminado 18k y plata 925",
  // Eslogan corto de marca: acompaña al logo (Hero, footer).
  slogan: "Tú mereces brillar",
  // Dato real de marca (8 años en el mercado): se repite en Historia y en
  // el contador de estadísticas — no lo cambies sin confirmar con el cliente.
  yearsInMarket: 8,
  // ~155-160 caracteres: el máximo que Google suele mostrar en el resultado
  // de búsqueda sin truncar. Se usa como meta description global y en
  // OpenGraph/Twitter (app/layout.tsx).
  description:
    "Joyería en oro laminado y plata 925, en Medellín desde hace 8 años. Anillos, cadenas, aretes, dijes y pulseras. Compra por WhatsApp, envíos a toda Colombia.",
  whatsapp: "573016004940",
  whatsappDisplay: "+57 301 600 4940",
  instagram: "https://www.instagram.com/joyeria.treegold18k/",
  email: "Juangonzalez.treegold@gmail.com",
  address: "Calle 49 # 7 - 28, Buenos Aires, Medellín",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Calle+49+%237+-+28+Buenos+Aires+Medellin",
  city: "Colombia",
  currency: "COP",
};

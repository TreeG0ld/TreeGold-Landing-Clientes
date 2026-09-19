import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Marcellus, Jost } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import SiteChrome from "@/components/SiteChrome";
import Footer from "@/components/Footer";

// Marcellus solo existe en peso 400: los títulos toman su carácter de la
// propia fuente, no del peso.
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marcellus",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jost",
  display: "swap",
});

// Imagen de la vista previa al compartir el enlace (WhatsApp, Facebook…).
// Es la misma de los medios de pago del aviso de inicio: el dueño prefiere que
// al compartir se vea que hay crédito con Addi y Sistecrédito antes que el
// logo. Cloudinary la entrega en 1200x630, la proporción que esperan esas
// plataformas, rellenando con negro (el fondo de la foto ya es negro, así que
// no se nota) en vez de recortar: con recorte se perderían los globos de los
// extremos.
const OG_IMAGE = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_pad,b_black,ar_1.91,w_1200,f_jpg,q_auto/treegold/marca/medios-de-pago.png`;

// Identificador público de Google Analytics (viaja en el HTML de todas las
// páginas, no es un secreto). Va en el código y no en el .env a propósito: si
// faltara la variable en el servidor, la medición se caería sin avisar.
const GA_MEASUREMENT_ID = "G-2W58WXHQMS";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.fullName} — ${site.tagline}`,
    template: `%s · ${site.fullName}`,
  },
  description: site.description,
  keywords: [
    "joyería",
    "joyería de oro laminado",
    "oro laminado",
    "plata 925",
    "anillos",
    "cadenas",
    "aretes",
    "dijes",
    "pulseras",
    "Medellín",
    "TreeGold",
  ],
  applicationName: site.fullName,
  authors: [{ name: site.fullName }],
  alternates: { canonical: "/" },
  openGraph: {
    title: site.fullName,
    description: site.description,
    type: "website",
    locale: "es_CO",
    url: site.url,
    siteName: site.fullName,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Paga con Addi, Sistecrédito o tarjetas débito y crédito",
      },
    ],
  },
  twitter: {
    // "summary_large_image" y no "summary": con el segundo la vista previa
    // sale como una miniatura cuadrada y se perdería media imagen.
    card: "summary_large_image",
    title: site.fullName,
    description: site.description,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#1c1917",
  width: "device-width",
  initialScale: 1,
};

// Datos de negocio (JewelryStore, subtipo de LocalBusiness) para SEO local:
// habilita rich results de Google (mapa, horario, teléfono) en búsquedas
// como "joyería cerca de mí" o el propio nombre de la marca. Se sirve en
// TODAS las páginas (patrón recomendado por Google para Organization/
// LocalBusiness). Solo usa datos ya públicos en el sitio (mismo horario y
// dirección que aparecen en /contacto y en el Footer).
// Fotos editoriales (las mismas del carrusel de la home) en vez del logo.
// `image` es de donde Google saca la miniatura del resultado de búsqueda, y una
// persona usando las joyas llama mucho más que un logotipo — que es justo la
// diferencia con la competencia que sí sale con foto. El logo no se pierde:
// va en `logo`, que es su campo propio.
const BRAND_PHOTOS = [
  // Modelo con collar de plata (la principal).
  "https://res.cloudinary.com/dkab59i18/image/upload/w_1200,f_jpg,q_auto/v1783708925/treegold/marca/WhatsApp_Image_2026-07-06_at_10.47.47_2.jpg",
  // Modelo con el estuche de regalo del conjunto dorado.
  "https://res.cloudinary.com/dkab59i18/image/upload/w_1200,f_jpg,q_auto/v1783708927/treegold/marca/WhatsApp_Image_2026-07-06_at_10.47.46_1.jpg",
];

const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  name: site.fullName,
  image: BRAND_PHOTOS,
  logo: `${site.url}/logo.png`,
  url: site.url,
  telephone: `+${site.whatsapp}`,
  email: site.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Calle 49 # 7 - 28, Buenos Aires",
    addressLocality: "Medellín",
    addressRegion: "Antioquia",
    addressCountry: "CO",
  },
  sameAs: [site.instagram],
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    opens: "09:00",
    closes: "18:00",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${marcellus.variable} ${jost.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd).replace(/</g, "\\u003c") }}
        />

        {/* Google Analytics. `afterInteractive` lo carga DESPUÉS de que la
            página ya responde al usuario: medir no debe retrasar la tienda.
            Los hosts de Google están permitidos uno a uno en la política de
            seguridad de next.config.mjs (script-src, connect-src e img-src);
            sin eso el navegador bloquearía la medición en silencio. */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
        </Script>
        <SiteChrome footer={<Footer />}>{children}</SiteChrome>
      </body>
    </html>
  );
}

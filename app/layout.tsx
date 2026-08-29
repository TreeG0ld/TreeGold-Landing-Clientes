import type { Metadata, Viewport } from "next";
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
    images: [{ url: "/logo.png", width: 820, height: 876, alt: site.fullName }],
  },
  twitter: {
    card: "summary",
    title: site.fullName,
    description: site.description,
    images: ["/logo.png"],
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
const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": "JewelryStore",
  name: site.fullName,
  image: `${site.url}/logo.png`,
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
        <SiteChrome footer={<Footer />}>{children}</SiteChrome>
      </body>
    </html>
  );
}

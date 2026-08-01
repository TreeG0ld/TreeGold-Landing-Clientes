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
        <SiteChrome footer={<Footer />}>{children}</SiteChrome>
      </body>
    </html>
  );
}

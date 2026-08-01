// Cabeceras de seguridad aplicadas a todas las rutas.
//  - Referrer-Policy: evita filtrar la URL /mayoristas-<código> vía el header
//    Referer al navegar a sitios externos (el código secreto vive en la URL).
//  - X-Frame-Options / frame-ancestors: impide que el sitio se cargue dentro
//    de un iframe ajeno (clickjacking), incluido el panel /admin.
//  - X-Content-Type-Options: desactiva el MIME-sniffing.
//  - HSTS: fuerza HTTPS en producción (el navegador la ignora en http local).
const securityHeaders = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Paquetes que deben quedar fuera del bundle del servidor (driver de Postgres).
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  experimental: {
    // Estas librerías exportan todo desde un solo índice: sin esto, importar
    // un icono suelto (`import { Plus } from "lucide-react"`) puede arrastrar
    // el paquete entero al bundle. Next reescribe cada import para traer solo
    // lo que se usa.
    optimizePackageImports: ["lucide-react", "motion", "embla-carousel-react"],
  },
  images: {
    // Loader propio: optimiza cada imagen (formato, calidad y tamaño)
    // a partir de su URL. Ver lib/imageLoader.ts.
    loader: "custom",
    loaderFile: "./lib/imageLoader.ts",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

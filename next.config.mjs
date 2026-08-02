// Cabeceras de seguridad aplicadas a todas las rutas.
//  - Referrer-Policy: evita filtrar la URL /mayoristas-<código> vía el header
//    Referer al navegar a sitios externos (el código secreto vive en la URL).
//  - X-Frame-Options / frame-ancestors: impide que el sitio se cargue dentro
//    de un iframe ajeno (clickjacking), incluido el panel /admin.
//  - X-Content-Type-Options: desactiva el MIME-sniffing.
//  - HSTS: fuerza HTTPS en producción (el navegador la ignora en http local).
//  - CSP: ver el bloque de abajo.

// next dev => 'development'; next build / next start => 'production'.
// Se ramifica con NODE_ENV a propósito, para no depender de una variable nueva
// que haya que acordarse de configurar en Vercel.
// Comparación positiva contra "development" (no negativa contra "production"):
// así, si NODE_ENV llega vacío, mal escrito o con un valor que Next no fija
// (p.ej. "test", o ausente en algún runtime raro), el resultado es isDev=false
// y se sirve la CSP estricta de producción — falla cerrado, no abierto.
const isDev = process.env.NODE_ENV === "development";

// --- Content-Security-Policy ---
//
// Sinceridad ante todo: script-src es la directiva DÉBIL de esta política.
// Lleva 'unsafe-inline' y eso significa que, si alguna vez conseguimos meter
// HTML de un tercero en la página, la CSP no frenará un <script> inline. Se
// acepta a conciencia porque la alternativa (nonce por petición) exige generar
// el nonce en un middleware que corra en TODAS las rutas, y eso convierte el
// sitio en dinámico: adiós al revalidate=3600 (app/page.tsx,
// app/producto/[slug]/page.tsx, app/sitemap.ts), al unstable_cache de
// lib/catalog.ts y al generateStaticParams del detalle de producto. Tampoco
// sirven los hashes: el App Router emite scripts inline self.__next_f.push(...)
// cuyo contenido cambia en cada página y en cada revalidación.
//
// Lo que SÍ aporta valor real aquí, y es la razón de poner la CSP igualmente:
//   - connect-src: aunque entrara un script, no puede exfiltrar datos a un
//     dominio ajeno (solo 'self' y api.cloudinary.com, el único fetch
//     cross-origin del proyecto, en components/admin/ImageUploader.tsx).
//   - base-uri 'self': impide secuestrar todas las URLs relativas de la página
//     inyectando un <base href="https://malo/">.
//   - object-src 'none': mata <object>/<embed>, vectores clásicos de plugins.
//   - frame-ancestors 'none': clickjacking, sobre todo del panel /admin.
//   - form-action 'self': un formulario inyectado no puede postear las
//     credenciales del admin a un servidor externo.
// Es decir: no evita el XSS, pero sí le quita casi todas las salidas.
//
// Nota: X-Frame-Options: DENY (arriba) y frame-ancestors 'none' son
// redundantes entre sí. Se mantienen los dos a propósito: frame-ancestors es
// el estándar actual y X-Frame-Options cubre navegadores viejos que lo ignoran.
//
// 'unsafe-inline' en style-src NO es cosmético: next/image añade siempre un
// atributo style inline a cada <img> (color:transparent, y position/width/height
// con `fill`), así que sin él se rompe el layout de la tienda entera, no solo
// las animaciones en cascada que usan style={{ "--i": i }}.
//
// img-src necesita los hosts remotos porque el loader es custom
// (images.loader, más abajo): no existe /_next/image y cada <img> pide la foto
// directamente a Cloudinary o a Unsplash.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["frame-src 'none'"]),
  "form-action 'self'",
  // dev: 'unsafe-eval' es obligatorio por el devtool 'eval-source-map' que usa
  // webpack en desarrollo (HMR / react-refresh). En producción NUNCA: ni gsap
  // ni motion usan eval/new Function.
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  // Compensa parcialmente el 'unsafe-inline' de arriba: corta los manejadores
  // inline tipo onclick="..." (React 19 nunca emite atributos on*="").
  ...(isDev ? [] : ["script-src-attr 'none'"]),
  "style-src 'self' 'unsafe-inline'",
  // Sin data: ni blob: en producción: hoy ningún <Image> usa placeholder="blur",
  // que es lo único que generaría un data:image/svg+xml.
  isDev
    ? "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com"
    : "img-src 'self' https://res.cloudinary.com https://images.unsplash.com",
  // next/font auto-hospeda los .woff2 en /_next/static/media: no hace falta
  // fonts.gstatic.com ni fonts.googleapis.com.
  isDev ? "font-src 'self' data:" : "font-src 'self'",
  // dev: ws/wss para el socket de HMR.
  isDev
    ? "connect-src 'self' ws: wss: https://api.cloudinary.com"
    : "connect-src 'self' https://api.cloudinary.com",
  "media-src 'none'",
  ...(isDev ? [] : ["worker-src 'none'"]),
  "manifest-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

// Fase 3 del despliegue: la política completa (`csp`) pasa de Report-Only a
// hacerse cumplir. Ninguna directiva nueva de esta fase restringe scripts,
// estilos o imágenes más de lo que ya permitían script-src/style-src/img-src
// en Report-Only (siguen con 'unsafe-inline' donde ya lo tenían) — lo único
// que cambia es que connect-src, frame-src, worker-src, manifest-src y
// upgrade-insecure-requests dejan de ser meramente informativos. Verificado
// contra el único fetch cross-origin real del sitio (ImageUploader ->
// api.cloudinary.com, cubierto por connect-src) y contra que no hay ningún
// <iframe> ni Service Worker en el proyecto (frame-src/worker-src 'none').
// Recomendado igual: probar `npm run build && npm start` contra /admin ->
// subir una imagen, antes de dar por buena la fase 3 en producción real.
const securityHeaders = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Solo en producción: con preload activo, un navegador que alguna vez
  // recibió esta cabecera fuerza HTTPS en el dominio durante hasta 2 años,
  // también contra subdominios. Mandarla en desarrollo (donde se navega por
  // http://localhost) no protege nada y sí puede dejar un dominio de prueba
  // (p.ej. un túnel de Cloudflare reutilizado) atascado en HTTPS-only.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Content-Security-Policy", value: csp },
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

// Validación del acceso al catálogo de mayoristas (/mayoristas-<código>).
// Extraída de app/[slug]/page.tsx para poder probarla de forma aislada:
// la página solo decide "notFound o render" a partir de estas dos funciones.

export const WHOLESALE_PREFIX = "mayoristas-";

// Extrae el código de un slug tipo "mayoristas-abc123". Devuelve null si el
// slug no corresponde a la ruta de mayoristas.
export function extractWholesaleCode(slug: string): string | null {
  if (!slug.startsWith(WHOLESALE_PREFIX)) return null;
  return slug.slice(WHOLESALE_PREFIX.length);
}

// Compara el código con WHOLESALE_SECRET. Si el secreto no está configurado,
// SIEMPRE devuelve false (la ruta queda cerrada, nunca abierta por accidente).
export function isValidWholesaleCode(code: string | null): boolean {
  const secret = process.env.WHOLESALE_SECRET;
  if (!secret || !code) return false;
  return code === secret;
}

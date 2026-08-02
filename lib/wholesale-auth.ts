// Validación del acceso al catálogo de mayoristas (/mayoristas-<código>).
// Extraída de app/[slug]/page.tsx para poder probarla de forma aislada:
// la página solo decide "notFound o render" a partir de estas dos funciones.

import { timingSafeEqual } from "@/lib/auth";

export const WHOLESALE_PREFIX = "mayoristas-";

// Extrae el código de un slug tipo "mayoristas-abc123". Devuelve null si el
// slug no corresponde a la ruta de mayoristas.
export function extractWholesaleCode(slug: string): string | null {
  if (!slug.startsWith(WHOLESALE_PREFIX)) return null;
  return slug.slice(WHOLESALE_PREFIX.length);
}

// Compara el código con WHOLESALE_SECRET en tiempo constante (timingSafeEqual
// hashea ambos lados con SHA-256, así no filtra la longitud ni el prefijo
// acertado). Si el secreto no está configurado, SIEMPRE devuelve false (la
// ruta queda cerrada, nunca abierta por accidente).
//
// El early-return va ANTES de timingSafeEqual a propósito: TextEncoder
// convierte undefined en "" y null en "null", así que hashear un secreto
// ausente contra un código vacío daría TRUE y abriría la ruta.
//
// Ese early-return no filtra nada útil por timing: solo revela si el secreto
// está configurado en el servidor (constante, no depende del input del
// atacante) y si el atacante mandó un código vacío (algo que él ya sabe).
export async function isValidWholesaleCode(code: string | null): Promise<boolean> {
  const secret = process.env.WHOLESALE_SECRET;
  if (!secret || !code) return false;
  return timingSafeEqual(code, secret);
}

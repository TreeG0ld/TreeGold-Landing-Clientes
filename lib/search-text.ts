// Coincidencia de texto para los buscadores (tienda pública y catálogo
// mayorista). Vive aquí y no dentro de una de las dos capas de datos porque
// las reglas son las mismas y duplicarlas garantizaba que una se corrigiera y
// la otra no.
//
// Es pura: no toca base de datos ni navegador.

// Deja el texto comparable: sin tildes y en minúscula.
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Palabras del término de búsqueda. Se recorta la "s" final (en palabras de
// más de 3 letras) porque el cliente escribe el plural —"anillos"— y los
// productos están en singular —"Anillo …".
export function searchWords(q: string): string[] {
  return normalizeText(q)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w));
}

// Deja un código comparable: sin tildes, en minúscula y solo letras y números,
// para que "B-45028", "b45028" y "B 45028" sean lo mismo.
function compactCode(text: string): string {
  return normalizeText(text).replace(/[^a-z0-9]/g, "");
}

// Código de referencia del producto (su slug: "20004", "PH044", "B-45028"). Es
// el que llega en los pedidos de WhatsApp ("Ref: 20004"), así que buscarlo
// tiene que encontrar la pieza aunque el código no se muestre en la tienda.
//
// Cuenta solo si la búsqueda ENTERA es el código o su comienzo (mínimo 3
// caracteres). Mezclarlo con la búsqueda por palabras daría falsos positivos:
// "cadena 45" traería cualquier cadena cuyo código tenga un 45. Se acepta la
// línea del pedido pegada tal cual ("Ref: 20004").
export function matchesCode(code: string, q: string): boolean {
  const term = compactCode(normalizeText(q).trim().replace(/^ref\b\.?:?/, ""));
  if (term.length < 3) return false;
  return compactCode(code).startsWith(term);
}

// Exige TODAS las palabras, así "anillo aura" encuentra "Anillo Aura" aunque
// esa frase exacta no esté en el nombre.
export function matchesSearch(name: string, words: string[]): boolean {
  if (words.length === 0) return true;
  const normalized = normalizeText(name);
  return words.every((w) => normalized.includes(w));
}

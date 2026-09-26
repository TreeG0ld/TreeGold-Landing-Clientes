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

// Exige TODAS las palabras, así "anillo aura" encuentra "Anillo Aura" aunque
// esa frase exacta no esté en el nombre.
export function matchesSearch(name: string, words: string[]): boolean {
  if (words.length === 0) return true;
  const normalized = normalizeText(name);
  return words.every((w) => normalized.includes(w));
}

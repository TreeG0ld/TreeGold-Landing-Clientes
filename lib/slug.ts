// Convierte un texto libre en un slug URL-safe: minúsculas, sin acentos ni
// símbolos, con guiones. Compartido por las rutas de categorías (crear/renombrar)
// para que el slug siempre quede consistente con el nombre.
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

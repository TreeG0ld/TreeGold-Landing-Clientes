// Funciones puras de parsing (sin efectos secundarios) usadas por el seed.
// Se mantienen aquí para poder probarlas de forma aislada.

export const IMG_EXT = /\.(jpe?g|png|webp)$/i;

// Convierte "Anillos " -> "anillos", "Topos" -> "topos", etc.
export function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Del nombre del archivo saca el código (SKU) y los precios.
// Ejemplos:
//   "09120117 _ $74.500 - $120.000.jpg" -> { code: "09120117", prices: [74500, 120000] }
//   "09120104 / $73800 - $140.000.jpg"  -> { code: "09120104", prices: [73800, 140000] }
//   "09120087 / $114.500 $200.000.jpg"  -> { code: "09120087", prices: [114500, 200000] }
export function parseFileName(filename) {
  const base = filename.replace(IMG_EXT, "");

  // El código es el primer grupo largo de dígitos (los SKU tienen 8).
  const codeMatch = base.match(/\d{4,}/);
  const code = codeMatch ? codeMatch[0] : null;

  // Los precios son los grupos que empiezan con "$".
  // En Colombia el "." es separador de miles -> se quitan todos los no-dígitos.
  const priceTokens = base.match(/\$\s*[\d.,]+/g) || [];
  const prices = priceTokens
    .map((t) => parseInt(t.replace(/\D/g, ""), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  return { code, prices };
}

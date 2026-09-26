// Validación y saneo del payload de un producto (crear/editar desde /admin).
// Centraliza las reglas para que las dos rutas (POST y PATCH) las compartan y
// para que nunca lleguen a Prisma valores inválidos (NaN, precios negativos,
// strings sin límite, etc.). Devuelve datos ya tipados listos para Prisma.

const MAX_TEXT = 200; // nombre, slug, material, size
const MAX_DESCRIPTION = 5000;
const MAX_IMAGES = 20;
const MAX_URL = 2048;
const MAX_PRICE = 1_000_000_000; // tope defensivo (COP)

export type ValidatedProduct = {
  slug: string;
  name: string;
  description: string;
  retailPrice: number;
  wholesalePrice: number | null;
  stock: number;
  material: string | null;
  size: string | null;
  images: string[];
  isRetail: boolean;
  isWholesale: boolean;
  isPromo: boolean;
  originalPrice: number | null;
  categoryId: string;
};

export type ValidationResult =
  | { ok: true; data: ValidatedProduct }
  | { ok: false; error: string };

function cleanString(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

// Precio: acepta número o string numérico; rechaza NaN, infinito y negativos.
function parsePrice(v: unknown): number | null {
  if (v === "" || v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0 || n > MAX_PRICE) return null;
  return n;
}

export function validateProductPayload(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Cuerpo de la petición inválido." };
  }
  const b = body as Record<string, unknown>;

  const slug = cleanString(b.slug, MAX_TEXT);
  if (!slug) return { ok: false, error: "El código (slug) es obligatorio." };
  // El código es la dirección web del producto (/producto/<código>). Un espacio
  // ahí rompe la página: tres productos quedaron inaccesibles ("COMBO 3",
  // "Combo 4", "COMBO 2") hasta que se detectó. Se permiten letras, números,
  // guiones, guion bajo y punto, que es lo que admite una URL sin codificar.
  if (!/^[a-zA-Z0-9._-]+$/.test(slug)) {
    return {
      ok: false,
      error:
        "El código solo puede tener letras, números, guiones (-), guion bajo (_) y puntos. Sin espacios ni tildes: por ejemplo, escribe COMBO-3 en vez de COMBO 3.",
    };
  }

  const name = cleanString(b.name, MAX_TEXT);
  if (!name) return { ok: false, error: "El nombre es obligatorio." };

  const categoryId = cleanString(b.categoryId, MAX_TEXT);
  if (!categoryId) return { ok: false, error: "La categoría es obligatoria." };

  const retailPrice = parsePrice(b.retailPrice);
  if (retailPrice === null) {
    return { ok: false, error: "El precio de venta debe ser un número válido (≥ 0)." };
  }

  // wholesalePrice es opcional, pero si viene un valor no vacío debe ser válido.
  let wholesalePrice: number | null = null;
  if (b.wholesalePrice !== "" && b.wholesalePrice != null) {
    wholesalePrice = parsePrice(b.wholesalePrice);
    if (wholesalePrice === null) {
      return { ok: false, error: "El precio de costo debe ser un número válido (≥ 0)." };
    }
  }

  // originalPrice opcional para promos
  let originalPrice: number | null = null;
  if (b.originalPrice !== "" && b.originalPrice != null) {
    originalPrice = parsePrice(b.originalPrice);
    if (originalPrice === null) {
      return { ok: false, error: "El precio original (antes de promo) debe ser un número válido (≥ 0)." };
    }
  }

  const isRetail = Boolean(b.isRetail);
  const isWholesale = Boolean(b.isWholesale);
  const isPromo = Boolean(b.isPromo);
  if (!isRetail && !isWholesale) {
    return {
      ok: false,
      error: "El producto debe ser visible en al menos una tienda (detal o mayorista).",
    };
  }

  // stock: entero >= 0 (default 0 si viene basura).
  const stockNum = typeof b.stock === "number" ? b.stock : Number(b.stock);
  const stock = Number.isFinite(stockNum) && stockNum > 0 ? Math.floor(stockNum) : 0;

  // images: solo strings, con tope de cantidad y de longitud de URL.
  const rawImages = Array.isArray(b.images) ? b.images : [];
  const images = rawImages
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .slice(0, MAX_IMAGES)
    .map((x) => x.trim().slice(0, MAX_URL));

  const material = cleanString(b.material, MAX_TEXT) || null;
  const size = cleanString(b.size, MAX_TEXT) || null;
  const description = cleanString(b.description, MAX_DESCRIPTION);

  return {
    ok: true,
    data: {
      slug,
      name,
      description,
      retailPrice,
      wholesalePrice,
      originalPrice,
      stock,
      material,
      size,
      images,
      isRetail,
      isWholesale,
      isPromo,
      categoryId,
    },
  };
}

// Validación del checkout y cálculo de totales. Sin dependencias de servidor:
// lo usan /api/checkout y el formulario de /seleccion (la lista de
// departamentos y los límites tienen que ser los mismos en los dos lados).

// Los 32 departamentos + Bogotá D.C. Es una lista cerrada para que la
// dirección de envío llegue siempre escrita igual.
export const DEPARTAMENTOS = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bogotá D.C.",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
] as const;

export const CHECKOUT_LIMITS = {
  name: 120,
  email: 254,
  city: 80,
  address: 200,
  notes: 300,
  lines: 50, // referencias distintas por pedido
  qty: 100, // unidades de una misma referencia
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mismo formato que valida el panel para el código de producto.
const SLUG_RE = /^[a-zA-Z0-9._-]{1,200}$/;

export type CheckoutItem = { slug: string; qty: number };

export type CheckoutCustomer = {
  name: string;
  email: string;
  phone: string; // 10 dígitos, sin +57
  department: string;
  city: string;
  address: string;
  notes: string | null;
};

export type CheckoutValidation =
  | { ok: true; data: { items: CheckoutItem[]; customer: CheckoutCustomer } }
  | { ok: false; error: string };

function text(v: unknown): string {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
}

// Celulares y fijos en Colombia tienen 10 dígitos. Se aceptan espacios,
// guiones y el indicativo (+57 / 57) porque así lo escribe la gente.
export function normalizePhone(v: unknown): string | null {
  if (typeof v !== "string") return null;
  let digits = v.replace(/[\s().-]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.length === 12 && digits.startsWith("57")) digits = digits.slice(2);
  return digits.length === 10 ? digits : null;
}

export function validateCheckoutPayload(body: unknown): CheckoutValidation {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Cuerpo de la petición inválido." };
  }
  const b = body as Record<string, unknown>;

  // --- Piezas: solo código y cantidad. El precio NUNCA se toma del navegador.
  if (!Array.isArray(b.items) || b.items.length === 0) {
    return { ok: false, error: "Tu selección está vacía." };
  }
  if (b.items.length > CHECKOUT_LIMITS.lines) {
    return { ok: false, error: `Un pedido admite hasta ${CHECKOUT_LIMITS.lines} referencias.` };
  }
  // La misma pieza puede venir en dos líneas (el carrito separa por talla):
  // se suman para revisar el stock sobre el total real.
  const bySlug = new Map<string, number>();
  for (const raw of b.items) {
    const it = raw as Record<string, unknown> | null;
    const slug = typeof it?.slug === "string" ? it.slug : "";
    const qty = it?.qty;
    if (!SLUG_RE.test(slug) || typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) {
      return { ok: false, error: "Hay una pieza inválida en tu selección." };
    }
    bySlug.set(slug, (bySlug.get(slug) ?? 0) + qty);
  }
  for (const qty of bySlug.values()) {
    if (qty > CHECKOUT_LIMITS.qty) {
      return {
        ok: false,
        error: `Para más de ${CHECKOUT_LIMITS.qty} unidades de una misma pieza, escríbenos por WhatsApp.`,
      };
    }
  }
  const items = [...bySlug].map(([slug, qty]) => ({ slug, qty }));

  // --- Datos de contacto y envío.
  const c = (typeof b.customer === "object" && b.customer !== null ? b.customer : {}) as Record<
    string,
    unknown
  >;
  const name = text(c.name);
  const email = text(c.email).toLowerCase();
  const phone = normalizePhone(c.phone);
  const department = text(c.department);
  const city = text(c.city);
  const address = text(c.address);
  const notes = text(c.notes);

  if (name.length < 2 || name.length > CHECKOUT_LIMITS.name) {
    return { ok: false, error: "Escribe tu nombre completo." };
  }
  if (email.length > CHECKOUT_LIMITS.email || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Escribe un correo electrónico válido." };
  }
  if (!phone) {
    return { ok: false, error: "Escribe un celular de 10 dígitos." };
  }
  if (!(DEPARTAMENTOS as readonly string[]).includes(department)) {
    return { ok: false, error: "Elige el departamento de envío." };
  }
  if (city.length < 2 || city.length > CHECKOUT_LIMITS.city) {
    return { ok: false, error: "Escribe la ciudad o municipio de envío." };
  }
  if (address.length < 5 || address.length > CHECKOUT_LIMITS.address) {
    return { ok: false, error: "Escribe la dirección de envío completa." };
  }
  if (notes.length > CHECKOUT_LIMITS.notes) {
    return {
      ok: false,
      error: `Las indicaciones no pueden superar los ${CHECKOUT_LIMITS.notes} caracteres.`,
    };
  }

  return {
    ok: true,
    data: {
      items,
      customer: { name, email, phone, department, city, address, notes: notes || null },
    },
  };
}

// Envío según el subtotal de las piezas: la tarifa fija, o 0 desde
// `freeFrom` (inclusive). Una sola regla para cobrar (/api/checkout) y para
// mostrar (selección), así lo que ve el cliente es lo que se le cobra.
export function shippingFor(
  subtotal: number,
  rule: { shippingCost: number; freeShippingFrom: number }
): number {
  return subtotal >= rule.freeShippingFrom ? 0 : rule.shippingCost;
}

// Totales en pesos a partir de los precios de la BASE DE DATOS. Los precios
// del catálogo son pesos enteros, así que el paso a centavos es exacto.
export function computeTotals(
  lines: { unitPrice: number; qty: number }[],
  rule: { shippingCost: number; freeShippingFrom: number }
): { subtotal: number; shippingCost: number; total: number; amountInCents: number } {
  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.qty, 0);
  const shippingCost = shippingFor(subtotal, rule);
  const total = subtotal + shippingCost;
  return { subtotal, shippingCost, total, amountInCents: Math.round(total * 100) };
}

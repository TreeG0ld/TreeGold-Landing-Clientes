// Tests UNITARIOS de lib/validate-product.ts — la validación/saneo del payload
// de productos del panel admin. Prioridad: validación de input (seguridad).
import test from "node:test";
import assert from "node:assert/strict";

const { validateProductPayload } = await import("../lib/validate-product.ts");

const base = {
  slug: "anillo-oro",
  name: "Anillo Oro",
  categoryId: "cat-1",
  retailPrice: 100000,
  images: [],
  isRetail: true,
  isWholesale: false,
};

test("unitario: payload válido -> ok con datos tipados", () => {
  const r = validateProductPayload(base);
  assert.equal(r.ok, true);
  assert.equal(r.data.retailPrice, 100000);
  assert.equal(r.data.wholesalePrice, null);
  assert.equal(r.data.stock, 0);
});

test("unitario: precio negativo -> rechazado", () => {
  const r = validateProductPayload({ ...base, retailPrice: -1 });
  assert.equal(r.ok, false);
});

test("unitario: precio no numérico (NaN) -> rechazado", () => {
  assert.equal(validateProductPayload({ ...base, retailPrice: "abc" }).ok, false);
  assert.equal(validateProductPayload({ ...base, retailPrice: NaN }).ok, false);
  assert.equal(validateProductPayload({ ...base, retailPrice: Infinity }).ok, false);
});

test("unitario: precio como string numérico -> aceptado y convertido", () => {
  const r = validateProductPayload({ ...base, retailPrice: "250000" });
  assert.equal(r.ok, true);
  assert.equal(r.data.retailPrice, 250000);
});

test("unitario: sin nombre -> rechazado", () => {
  assert.equal(validateProductPayload({ ...base, name: "" }).ok, false);
  assert.equal(validateProductPayload({ ...base, name: "   " }).ok, false);
  assert.equal(validateProductPayload({ ...base, name: undefined }).ok, false);
});

test("unitario: sin slug o sin categoría -> rechazado", () => {
  assert.equal(validateProductPayload({ ...base, slug: "" }).ok, false);
  assert.equal(validateProductPayload({ ...base, categoryId: "" }).ok, false);
});

test("unitario: isRetail y isWholesale ambos false -> rechazado", () => {
  const r = validateProductPayload({ ...base, isRetail: false, isWholesale: false });
  assert.equal(r.ok, false);
  assert.match(r.error, /al menos una tienda/i);
});

test("unitario: wholesalePrice vacío se guarda como null; inválido se rechaza", () => {
  assert.equal(validateProductPayload({ ...base, wholesalePrice: "" }).data.wholesalePrice, null);
  assert.equal(validateProductPayload({ ...base, wholesalePrice: null }).data.wholesalePrice, null);
  assert.equal(validateProductPayload({ ...base, wholesalePrice: 50000 }).data.wholesalePrice, 50000);
  assert.equal(validateProductPayload({ ...base, wholesalePrice: -5 }).ok, false);
});

test("unitario: stock se normaliza a entero >= 0", () => {
  assert.equal(validateProductPayload({ ...base, stock: 3.9 }).data.stock, 3);
  assert.equal(validateProductPayload({ ...base, stock: -10 }).data.stock, 0);
  assert.equal(validateProductPayload({ ...base, stock: "basura" }).data.stock, 0);
});

test("unitario: strings gigantes se recortan (defensa contra payloads enormes)", () => {
  const huge = "x".repeat(10_000);
  const r = validateProductPayload({ ...base, name: huge, description: huge });
  assert.ok(r.ok);
  assert.ok(r.data.name.length <= 200);
  assert.ok(r.data.description.length <= 5000);
});

test("unitario: images filtra no-strings y limita cantidad", () => {
  const r = validateProductPayload({
    ...base,
    images: ["https://a.jpg", 42, null, "", "  ", "https://b.jpg"],
  });
  assert.deepEqual(r.data.images, ["https://a.jpg", "https://b.jpg"]);
  const many = validateProductPayload({ ...base, images: Array(50).fill("https://x.jpg") });
  assert.ok(many.data.images.length <= 20);
});

test("unitario: unicode/emojis en nombre y material se conservan", () => {
  const r = validateProductPayload({ ...base, name: "Anillo Ñ 💍", material: "Oro 18k ✨" });
  assert.equal(r.data.name, "Anillo Ñ 💍");
  assert.equal(r.data.material, "Oro 18k ✨");
});

test("unitario: body que no es objeto -> rechazado sin lanzar", () => {
  assert.equal(validateProductPayload(null).ok, false);
  assert.equal(validateProductPayload("texto").ok, false);
  assert.equal(validateProductPayload(undefined).ok, false);
});

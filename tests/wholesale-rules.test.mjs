// Tests UNITARIOS de lib/wholesale-rules.ts — secciones de la balinería.
import test from "node:test";
import assert from "node:assert/strict";

const { groupBalines, BALINES_OTHER } = await import("../lib/wholesale-rules.ts");

const seccionDe = (name) => groupBalines([{ name }])[0].label;

test("unitario: cada tipo de pieza cae en su sección (nombres reales)", () => {
  const casos = {
    "Balin Lisa 3mm Dorada": "Balín liso",
    "Balin Liso Dorado 8 mm": "Balín liso",
    "Balin Diamantado 18K 4mm Dorado": "Balín diamantado",
    "Balín diamantado plata 3 mm": "Balín diamantado",
    // Así está escrito en la base de datos.
    "Balín dimanatado plata 5 mm": "Balín diamantado",
    "Balin Italiano 3mm": "Balinería italiana",
    // Diamantado, pero italiano: gana la regla italiana, que va antes.
    "Balin Diamantado Rosado 3mm (italy)": "Balinería italiana",
    "Balín MC 5mm": "Otros balines",
    "Balin X 6mm": "Otros balines",
    "Barril Aura": "Barriles",
    "Barril Diamantado 4 mm": "Barriles",
    "Canutillo Diamantado x3 und": "Canutillos",
    "Rondel Cristal 4mm": "Rondeles",
  };
  for (const [name, esperado] of Object.entries(casos)) assert.equal(seccionDe(name), esperado, name);
});

test("unitario: una pieza que no encaja va a 'Otros' (no desaparece)", () => {
  assert.equal(seccionDe("Cierre mosquetón 10mm"), BALINES_OTHER);
});

test("unitario: secciones en orden fijo, sin vacías, y tamaños de menor a mayor", () => {
  const grupos = groupBalines([
    { name: "Rondel Verde 4mm" },
    { name: "Balin Lisa 6mm Dorada" },
    { name: "Balin Lisa 3mm Dorada" },
    { name: "Balin Liso Dorado 8 mm" },
    { name: "Balin Lisa 4mm Dorada" },
  ]);
  assert.deepEqual(grupos.map((g) => g.label), ["Balín liso", "Rondeles"]);
  assert.deepEqual(
    grupos[0].items.map((i) => i.name),
    ["Balin Lisa 3mm Dorada", "Balin Lisa 4mm Dorada", "Balin Lisa 6mm Dorada", "Balin Liso Dorado 8 mm"]
  );
});

// --- Precios por tramo (balines lisos) ---------------------------------------
const { tiersForSlug, unitPriceFor, tierLabels } = await import("../lib/wholesale-rules.ts");

const TRAMOS_3MM = [
  { min: 12, price: 1800 },
  { min: 50, price: 1500 },
  { min: 100, price: 1300 },
  { min: 500, price: 1100 },
];

test("tramos: el precio cambia justo en cada límite (11, 12, 49, 50, 99, 100, 499, 500)", () => {
  const precio = (qty) => unitPriceFor({ price: 999, tiers: TRAMOS_3MM }, qty);
  assert.equal(precio(12), 1800);
  assert.equal(precio(49), 1800);
  assert.equal(precio(50), 1500);
  assert.equal(precio(99), 1500);
  assert.equal(precio(100), 1300);
  assert.equal(precio(499), 1300);
  assert.equal(precio(500), 1100);
  assert.equal(precio(5000), 1100);
  // Por debajo del mínimo de venta no hay tramo propio: usa el primero.
  assert.equal(precio(11), 1800);
});

test("tramos: sin tramos se usa el precio único de siempre", () => {
  assert.equal(unitPriceFor({ price: 2500 }, 60), 2500);
  assert.equal(unitPriceFor({ price: 2500, tiers: null }, 60), 2500);
  assert.equal(unitPriceFor({ price: 2500, tiers: [] }, 60), 2500);
});

test("tramos: la línea completa se cobra al precio de su tramo", () => {
  const total = 60 * unitPriceFor({ price: 1800, tiers: TRAMOS_3MM }, 60);
  assert.equal(total, 90000); // 60 × 1.500, no 60 × 1.800
});

test("tramos: etiquetas para mostrar", () => {
  assert.deepEqual(
    tierLabels(TRAMOS_3MM).map((t) => t.label),
    ["12–49 und", "50–99 und", "100–499 und", "500+ und"]
  );
});

test("tramos: los cinco balines lisos tienen sus cuatro tramos y el resto no", () => {
  assert.deepEqual(tiersForSlug("BL3"), TRAMOS_3MM);
  assert.equal(tiersForSlug("BL8")[3].price, 8800);
  for (const slug of ["BL3", "BL4", "BL5", "BL6", "BL8"]) {
    const t = tiersForSlug(slug);
    assert.deepEqual(t.map((x) => x.min), [12, 50, 100, 500]);
    // Los precios bajan al subir la cantidad.
    assert.ok(t.every((x, i) => i === 0 || x.price < t[i - 1].price), slug);
  }
  assert.equal(tiersForSlug("BD6"), null);
});

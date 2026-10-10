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

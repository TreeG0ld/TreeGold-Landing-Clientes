// Tests UNITARIOS de lib/search-text.ts — las reglas de los buscadores de la
// tienda pública y del catálogo mayorista.
import test from "node:test";
import assert from "node:assert/strict";

const { matchesSearch, matchesCode, searchWords } = await import("../lib/search-text.ts");

test("unitario: por nombre ignora tildes, mayúsculas y el plural", () => {
  assert.equal(matchesSearch("Topo trébol", searchWords("TREBOL")), true);
  assert.equal(matchesSearch("Anillo Aura", searchWords("anillos aura")), true);
  assert.equal(matchesSearch("Anillo Aura", searchWords("anillo oro")), false);
});

test("unitario: código exacto, como llega en el pedido de WhatsApp", () => {
  assert.equal(matchesCode("20004", "20004"), true);
  assert.equal(matchesCode("PH044", "ph044"), true);
  assert.equal(matchesCode("20004", "Ref: 20004"), true);
  assert.equal(matchesCode("20004", "  ref 20004 "), true);
});

test("unitario: código con guion se encuentra con o sin guion y con espacios", () => {
  for (const q of ["B-45028", "b45028", "B 45028", "b-45028"]) {
    assert.equal(matchesCode("B-45028", q), true, q);
  }
});

test("unitario: el comienzo del código (mín. 3 caracteres) también encuentra", () => {
  assert.equal(matchesCode("PH044", "ph0"), true);
  assert.equal(matchesCode("09021101", "0902"), true);
  // Menos de 3 caracteres: demasiado amplio para tratarlo como código.
  assert.equal(matchesCode("PH044", "ph"), false);
  assert.equal(matchesCode("20004", "20"), false);
});

test("unitario: el código no se mezcla con palabras sueltas (sin falsos positivos)", () => {
  // "cadena 45" no debe traer una pieza solo porque su código tenga un 45.
  assert.equal(matchesCode("B-45028", "cadena 45"), false);
  // Un trozo del MEDIO del código no cuenta: solo el comienzo.
  assert.equal(matchesCode("20004", "0004"), false);
  // "ref" solo se quita como prefijo separado, no dentro de otra palabra.
  assert.equal(matchesCode("REF123", "ref123"), true);
  assert.equal(matchesCode("20004", "refuerzo"), false);
});

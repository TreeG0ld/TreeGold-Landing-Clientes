import test from "node:test";
import assert from "node:assert/strict";
import { parseFileName, slugify } from "../scripts/parse-utils.mjs";

test("parseFileName: caso estándar (código + dos precios)", () => {
  const r = parseFileName("09120117 _ $74.500 - $120.000.jpg");
  assert.equal(r.code, "09120117");
  assert.deepEqual(r.prices, [74500, 120000]);
});

test("parseFileName: precio sin separador de miles ($73800)", () => {
  const r = parseFileName("09120104 / $73800 - $140.000.jpg");
  assert.equal(r.code, "09120104");
  assert.deepEqual(r.prices, [73800, 140000]);
});

test("parseFileName: precios sin guion entre ellos", () => {
  const r = parseFileName("09120087 / $114.500 $200.000.jpg");
  assert.deepEqual(r.prices, [114500, 200000]);
});

test("parseFileName: ignora medidas y sufijos que no son precios", () => {
  const r = parseFileName("09020051 / 4MM / $12.000 - $30.000 / 2-408.jpg");
  assert.equal(r.code, "09020051", "4MM y 2-408 no deben tomarse como código");
  assert.deepEqual(r.prices, [12000, 30000]);
});

test("parseFileName: prefijo de texto antes del código (RONDELES)", () => {
  const r = parseFileName("RONDELES 09140183 _ $27.500 - $25.000.jpg");
  assert.equal(r.code, "09140183");
  assert.deepEqual(r.prices, [27500, 25000], "respeta el orden (no ordena por mayor/menor)");
});

test("parseFileName: archivo sin precio -> prices vacío", () => {
  const r = parseFileName("09140108.jpg");
  assert.equal(r.code, "09140108");
  assert.deepEqual(r.prices, []);
});

test("parseFileName: archivo sin código -> code null", () => {
  const r = parseFileName("IMG_foto.jpg");
  assert.equal(r.code, null);
});

test("parseFileName: el orden de los precios se conserva (posicional)", () => {
  // Primero = costo, segundo = público; el orden NO se altera.
  const r = parseFileName("0001 _ $100.000 - $50.000.jpg");
  assert.deepEqual(r.prices, [100000, 50000]);
});

test("slugify: minúsculas, sin acentos, sin espacios", () => {
  assert.equal(slugify("Anillos "), "anillos");
  assert.equal(slugify("Topos"), "topos");
  assert.equal(slugify("  Diseño Único  "), "diseno-unico");
});

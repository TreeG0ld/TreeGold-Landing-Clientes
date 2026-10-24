// Tests UNITARIOS de los campos de precio del panel (lib/format.ts): se ven con
// punto de miles, pero se guarda solo el número.
import test from "node:test";
import assert from "node:assert/strict";

const { priceDigits, formatPriceInput } = await import("../lib/format.ts");

test("precio: se muestra con punto de miles", () => {
  assert.equal(formatPriceInput("380000"), "380.000");
  assert.equal(formatPriceInput("1200000"), "1.200.000");
  assert.equal(formatPriceInput("999"), "999");
});

test("precio: también separa los miles de 4 cifras", () => {
  assert.equal(formatPriceInput("5000"), "5.000");
});

test("precio: vacío se queda vacío", () => {
  assert.equal(formatPriceInput(""), "");
});

test("precio: un valor con decimales de la base de datos se redondea", () => {
  assert.equal(formatPriceInput("380000.6"), "380.001");
});

test("precio: se guardan solo los dígitos (el servidor leería '380.000' como 380)", () => {
  assert.equal(priceDigits("380.000"), "380000");
  assert.equal(priceDigits("$ 1.200.000"), "1200000");
  assert.equal(priceDigits("00450"), "450");
  assert.equal(priceDigits("0"), "0");
  assert.equal(priceDigits(""), "");
});

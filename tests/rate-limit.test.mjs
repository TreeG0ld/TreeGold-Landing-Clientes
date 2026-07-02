// Tests UNITARIOS de lib/rate-limit.ts — el freno de fuerza bruta del login.
import test from "node:test";
import assert from "node:assert/strict";

const { rateLimit, resetRateLimit } = await import("../lib/rate-limit.ts");

test("unitario: permite hasta el límite y luego bloquea", () => {
  const key = `k-${Math.random()}`;
  for (let i = 0; i < 5; i++) {
    assert.equal(rateLimit(key, 5, 60_000).allowed, true, `intento ${i + 1} debe pasar`);
  }
  const blocked = rateLimit(key, 5, 60_000);
  assert.equal(blocked.allowed, false, "el 6º intento debe bloquearse");
  assert.ok(blocked.retryAfterSeconds > 0, "debe indicar cuántos segundos esperar");
});

test("unitario: claves distintas no se afectan entre sí", () => {
  const a = `a-${Math.random()}`;
  const b = `b-${Math.random()}`;
  for (let i = 0; i < 5; i++) rateLimit(a, 5, 60_000);
  assert.equal(rateLimit(a, 5, 60_000).allowed, false);
  assert.equal(rateLimit(b, 5, 60_000).allowed, true, "otra IP no debe estar bloqueada");
});

test("unitario: la ventana se reinicia al expirar", () => {
  const key = `w-${Math.random()}`;
  // Ventana de 0ms: cada llamada ve la anterior como expirada.
  assert.equal(rateLimit(key, 1, 0).allowed, true);
  assert.equal(rateLimit(key, 1, 0).allowed, true, "tras expirar la ventana vuelve a permitir");
});

test("unitario: resetRateLimit limpia el contador (login correcto)", () => {
  const key = `r-${Math.random()}`;
  for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000);
  assert.equal(rateLimit(key, 5, 60_000).allowed, false);
  resetRateLimit(key);
  assert.equal(rateLimit(key, 5, 60_000).allowed, true, "tras reset el admin legítimo no queda penalizado");
});

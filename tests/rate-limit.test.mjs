// Tests UNITARIOS de lib/rate-limit.ts — el freno de fuerza bruta del login.
import test from "node:test";
import assert from "node:assert/strict";

const { rateLimit, resetRateLimit, refundRateLimit } = await import("../lib/rate-limit.ts");

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

// --- refundRateLimit: devuelve UN intento, no vacía la cubeta ---

test("unitario: refundRateLimit devuelve exactamente un intento", () => {
  const key = `rf-${Math.random()}`;
  for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000);
  refundRateLimit(key);
  assert.equal(rateLimit(key, 5, 60_000).allowed, true, "el intento devuelto vuelve a estar disponible");
  assert.equal(rateLimit(key, 5, 60_000).allowed, false, "pero solo uno: el siguiente bloquea");
});

test("seguridad: refundRateLimit NO permite reiniciar la cubeta a voluntad", () => {
  // Escenario del ataque que motivó quitar resetRateLimit(ipKey) del login:
  // 9 intentos fallidos contra cuentas ajenas + 1 login correcto propio, en
  // bucle. Con reset el contador volvía a 0 y el límite era infinito; con
  // refund cada ciclo deja 9 intentos netos y la cubeta acaba bloqueando.
  const key = `spray-${Math.random()}`;
  let blocked = false;
  for (let ciclo = 0; ciclo < 3 && !blocked; ciclo++) {
    for (let i = 0; i < 9; i++) {
      if (!rateLimit(key, 10, 60_000).allowed) blocked = true;
    }
    if (rateLimit(key, 10, 60_000).allowed) refundRateLimit(key);
    else blocked = true;
  }
  assert.equal(blocked, true, "el password spraying con cuenta propia debe acabar bloqueado");
});

test("unitario: refundRateLimit sobre una clave inexistente no crea bucket ni revienta", () => {
  const key = `rf-none-${Math.random()}`;
  refundRateLimit(key);
  assert.equal(rateLimit(key, 1, 60_000).allowed, true);
  assert.equal(rateLimit(key, 1, 60_000).allowed, false, "el refund previo no debe haber dado cupo extra");
});

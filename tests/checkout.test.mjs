// Tests UNITARIOS de lib/checkout.ts (validación del checkout y totales) y de
// lib/order-rules.ts (qué hace el webhook con cada estado de Wompi).
import test from "node:test";
import assert from "node:assert/strict";

const { validateCheckoutPayload, normalizePhone, computeTotals, shippingFor } = await import(
  "../lib/checkout.ts"
);
const { decideTransition } = await import("../lib/order-rules.ts");

const customer = {
  name: "Ana Pérez",
  email: "  Ana@Correo.CO ",
  phone: "300 123 4567",
  department: "Antioquia",
  city: "Medellín",
  address: "Calle 10 # 20 - 30",
  notes: "",
};

test("unitario: payload válido -> datos normalizados", () => {
  const r = validateCheckoutPayload({ items: [{ slug: "anillo-1", qty: 2 }], customer });
  assert.equal(r.ok, true);
  assert.deepEqual(r.data.items, [{ slug: "anillo-1", qty: 2 }]);
  assert.equal(r.data.customer.email, "ana@correo.co");
  assert.equal(r.data.customer.phone, "3001234567");
  assert.equal(r.data.customer.notes, null);
});

test("seguridad: el precio del navegador se descarta", () => {
  const r = validateCheckoutPayload({
    items: [{ slug: "anillo-1", qty: 1, price: 1 }],
    customer,
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.data.items, [{ slug: "anillo-1", qty: 1 }]);
});

test("unitario: la misma pieza en dos líneas se suma", () => {
  const r = validateCheckoutPayload({
    items: [
      { slug: "anillo-1", qty: 2 },
      { slug: "anillo-1", qty: 3 },
    ],
    customer,
  });
  assert.deepEqual(r.data.items, [{ slug: "anillo-1", qty: 5 }]);
});

test("validación: cantidades inválidas se rechazan", () => {
  for (const qty of [0, -1, 1.5, "2", null]) {
    const r = validateCheckoutPayload({ items: [{ slug: "anillo-1", qty }], customer });
    assert.equal(r.ok, false, `qty=${qty}`);
  }
});

test("validación: más de 100 unidades de una pieza -> WhatsApp", () => {
  const r = validateCheckoutPayload({ items: [{ slug: "a", qty: 101 }], customer });
  assert.equal(r.ok, false);
});

test("validación: slug con caracteres raros -> rechazo", () => {
  const r = validateCheckoutPayload({ items: [{ slug: "a b", qty: 1 }], customer });
  assert.equal(r.ok, false);
});

test("validación: selección vacía o sin items -> rechazo", () => {
  assert.equal(validateCheckoutPayload({ items: [], customer }).ok, false);
  assert.equal(validateCheckoutPayload({ customer }).ok, false);
  assert.equal(validateCheckoutPayload(null).ok, false);
});

test("validación: departamento fuera de la lista -> rechazo", () => {
  const r = validateCheckoutPayload({
    items: [{ slug: "a", qty: 1 }],
    customer: { ...customer, department: "Texas" },
  });
  assert.equal(r.ok, false);
});

test("validación: correo inválido -> rechazo", () => {
  const r = validateCheckoutPayload({
    items: [{ slug: "a", qty: 1 }],
    customer: { ...customer, email: "no-es-correo" },
  });
  assert.equal(r.ok, false);
});

test("unitario: normalizePhone acepta indicativo y separadores", () => {
  assert.equal(normalizePhone("+57 300 123 4567"), "3001234567");
  assert.equal(normalizePhone("573001234567"), "3001234567");
  assert.equal(normalizePhone("(604) 444-5566"), "6044445566");
  assert.equal(normalizePhone("12345"), null);
  assert.equal(normalizePhone("300abc4567"), null);
  assert.equal(normalizePhone(3001234567), null);
});

const REGLA = { shippingCost: 18000, freeShippingFrom: 600000 };

test("unitario: computeTotals suma envío y pasa a centavos", () => {
  const t = computeTotals(
    [
      { unitPrice: 85000, qty: 2 },
      { unitPrice: 42000, qty: 1 },
    ],
    REGLA
  );
  assert.deepEqual(t, {
    subtotal: 212000,
    shippingCost: 18000,
    total: 230000,
    amountInCents: 23000000,
  });
});

test("unitario: envío gratis desde 600.000 (inclusive), 18.000 por debajo", () => {
  assert.equal(shippingFor(599999, REGLA), 18000);
  assert.equal(shippingFor(600000, REGLA), 0);
  assert.equal(shippingFor(815000, REGLA), 0);
  const t = computeTotals([{ unitPrice: 300000, qty: 2 }], REGLA);
  assert.deepEqual(t, { subtotal: 600000, shippingCost: 0, total: 600000, amountInCents: 60000000 });
});

// --- decideTransition ---
const pending = { status: "PENDING", amountInCents: 22700000, currency: "COP" };
const approved = { status: "APPROVED", amount_in_cents: 22700000, currency: "COP" };

test("webhook: pendiente + APPROVED con el monto firmado -> pagar", () => {
  assert.deepEqual(decideTransition(pending, approved), { action: "pay" });
});

test("seguridad: APPROVED con otro monto -> no se marca pagado", () => {
  const r = decideTransition(pending, { ...approved, amount_in_cents: 100 });
  assert.equal(r.action, "ignore");
});

test("seguridad: APPROVED con otra moneda -> no se marca pagado", () => {
  const r = decideTransition(pending, { ...approved, currency: "USD" });
  assert.equal(r.action, "ignore");
});

test("webhook: aviso repetido sobre un pedido pagado -> ignorar", () => {
  const r = decideTransition({ ...pending, status: "PAID" }, approved);
  assert.equal(r.action, "ignore");
});

test("webhook: pendiente + DECLINED -> cerrar como rechazado", () => {
  assert.deepEqual(decideTransition(pending, { ...approved, status: "DECLINED" }), {
    action: "close",
    status: "DECLINED",
  });
});

test("webhook: rechazado y luego APPROVED (reintento) -> pagar", () => {
  const r = decideTransition({ ...pending, status: "DECLINED" }, approved);
  assert.deepEqual(r, { action: "pay" });
});

test("webhook: un rechazo no pisa otro estado final", () => {
  const r = decideTransition({ ...pending, status: "DECLINED" }, { ...approved, status: "ERROR" });
  assert.equal(r.action, "ignore");
});

test("webhook: transacción PENDING -> sin efecto", () => {
  const r = decideTransition(pending, { ...approved, status: "PENDING" });
  assert.equal(r.action, "ignore");
});

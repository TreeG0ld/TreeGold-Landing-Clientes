// Tests UNITARIOS de lib/wompi.ts — firma de integridad del checkout y
// verificación de los eventos del webhook. Prioridad: que un evento falso o
// manipulado NUNCA pase por bueno (sería entregar joyas sin cobrar).
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const { integritySignature, verifyEventChecksum, buildCheckoutUrl, expectedEnvironment, fetchWompiTransaction } =
  await import("../lib/wompi.ts");

const sha = (s) => createHash("sha256").update(s).digest("hex");
const SECRET = "test_events_secreto_de_prueba";

// Evento armado y firmado como lo haría Wompi (hash en mayúsculas).
function signedEvent(overrides = {}) {
  const event = {
    event: "transaction.updated",
    data: {
      transaction: {
        id: "1234-1610641025-49201",
        reference: "TG-00112233445566778899",
        status: "APPROVED",
        amount_in_cents: 4490000,
        currency: "COP",
      },
    },
    environment: "test",
    signature: {
      properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
      checksum: "",
    },
    timestamp: 1530291411,
    ...overrides,
  };
  event.signature.checksum = sha(
    "1234-1610641025-49201" + "APPROVED" + "4490000" + "1530291411" + SECRET
  ).toUpperCase();
  return event;
}

test("unitario: integritySignature = sha256(referencia+monto+moneda+secreto)", () => {
  const sig = integritySignature(
    { reference: "TG-ABC", amountInCents: 3500000, currency: "COP" },
    "test_integrity_x"
  );
  assert.equal(sig, sha("TG-ABC3500000COPtest_integrity_x"));
});

test("unitario: integritySignature incluye la expiración entre moneda y secreto", () => {
  const exp = "2026-09-30T20:00:00.000Z";
  const sig = integritySignature(
    { reference: "TG-ABC", amountInCents: 100, currency: "COP", expirationTime: exp },
    "s"
  );
  assert.equal(sig, sha(`TG-ABC100COP${exp}s`));
});

test("unitario: evento firmado correctamente -> válido", () => {
  assert.equal(verifyEventChecksum(signedEvent(), SECRET), true);
});

test("unitario: checksum en minúsculas también se acepta", () => {
  const e = signedEvent();
  e.signature.checksum = e.signature.checksum.toLowerCase();
  assert.equal(verifyEventChecksum(e, SECRET), true);
});

test("seguridad: cambiar el estado de un evento firmado lo invalida", () => {
  const e = signedEvent();
  e.data.transaction.status = "DECLINED";
  assert.equal(verifyEventChecksum(e, SECRET), false);
});

test("seguridad: cambiar el monto de un evento firmado lo invalida", () => {
  const e = signedEvent();
  e.data.transaction.amount_in_cents = 100;
  assert.equal(verifyEventChecksum(e, SECRET), false);
});

test("seguridad: otro secreto -> inválido", () => {
  assert.equal(verifyEventChecksum(signedEvent(), "otro_secreto"), false);
});

test("seguridad: secreto vacío -> inválido (falla cerrado)", () => {
  assert.equal(verifyEventChecksum(signedEvent(), ""), false);
});

test("seguridad: propiedad firmada ausente -> inválido", () => {
  const e = signedEvent();
  e.signature.properties = ["transaction.no_existe"];
  assert.equal(verifyEventChecksum(e, SECRET), false);
});

test("seguridad: sin firma, sin timestamp o sin objeto -> inválido", () => {
  const sinFirma = signedEvent();
  delete sinFirma.signature;
  assert.equal(verifyEventChecksum(sinFirma, SECRET), false);

  const sinTs = signedEvent();
  delete sinTs.timestamp;
  assert.equal(verifyEventChecksum(sinTs, SECRET), false);

  assert.equal(verifyEventChecksum(null, SECRET), false);
  assert.equal(verifyEventChecksum("texto", SECRET), false);
});

test("unitario: buildCheckoutUrl lleva los parámetros que pide Wompi", () => {
  const url = new URL(
    buildCheckoutUrl({
      publicKey: "pub_test_x",
      reference: "TG-ABC",
      amountInCents: 3500000,
      currency: "COP",
      signature: "firma",
      redirectUrl: "https://treegold.shop/pedido/TG-ABC",
      expirationTime: "2026-09-30T20:00:00.000Z",
      customer: { email: "a@b.co", fullName: "Ana Pérez", phone: "3001234567" },
      shipping: {
        addressLine1: "Calle 10 # 20 - 30",
        addressLine2: null,
        city: "Medellín",
        region: "Antioquia",
        phone: "3001234567",
        name: "Ana Pérez",
      },
    })
  );
  assert.equal(url.origin + url.pathname, "https://checkout.wompi.co/p/");
  assert.equal(url.searchParams.get("public-key"), "pub_test_x");
  assert.equal(url.searchParams.get("amount-in-cents"), "3500000");
  assert.equal(url.searchParams.get("signature:integrity"), "firma");
  assert.equal(url.searchParams.get("redirect-url"), "https://treegold.shop/pedido/TG-ABC");
  assert.equal(url.searchParams.get("expiration-time"), "2026-09-30T20:00:00.000Z");
  assert.equal(url.searchParams.get("shipping-address:city"), "Medellín");
  // Opcional vacío: no se manda.
  assert.equal(url.searchParams.has("shipping-address:address-line-2"), false);
});

test("unitario: address-line-2 solo si tiene 4+ caracteres (Wompi rechaza los cortos)", () => {
  const linea2 = (addressLine2) =>
    new URL(
      buildCheckoutUrl({
        publicKey: "pub_test_x", reference: "TG-ABC", amountInCents: 3500000, currency: "COP",
        signature: "firma", redirectUrl: "https://treegold.shop/pedido/TG-ABC",
        customer: { email: "a@b.co", fullName: "Ana Pérez", phone: "3001234567" },
        shipping: { addressLine1: "Calle 10 # 20 - 30", addressLine2, city: "Medellín",
          region: "Antioquia", phone: "3001234567", name: "Ana Pérez" },
      })
    ).searchParams.get("shipping-address:address-line-2");
  assert.equal(linea2("302"), null);
  assert.equal(linea2("  ap  "), null);
  assert.equal(linea2("Apto 302"), "Apto 302");
  assert.equal(linea2("  Casa  "), "Casa");
});

test("unitario: expectedEnvironment según el prefijo de la llave pública", () => {
  assert.equal(expectedEnvironment("pub_prod_abc"), "prod");
  assert.equal(expectedEnvironment("pub_test_abc"), "test");
});

// --- consulta de respaldo a la API de Wompi (fetchWompiTransaction) ---

const TX = { id: "12210070-1790996245-96217", reference: "TG-ABC", status: "APPROVED",
  amount_in_cents: 18400000, currency: "COP", payment_method_type: "CARD" };
function fakeFetch(body, { ok = true } = {}) {
  const calls = [];
  const fn = async (url) => { calls.push(url); return { ok, json: async () => body }; };
  fn.calls = calls;
  return fn;
}

test("unitario: consulta el sandbox con llave de pruebas y producción con la de producción", async () => {
  const f1 = fakeFetch({ data: TX });
  await fetchWompiTransaction(TX.id, "pub_test_x", f1);
  assert.equal(f1.calls[0], `https://sandbox.wompi.co/v1/transactions/${TX.id}`);
  const f2 = fakeFetch({ data: TX });
  await fetchWompiTransaction(TX.id, "pub_prod_x", f2);
  assert.equal(f2.calls[0], `https://production.wompi.co/v1/transactions/${TX.id}`);
});

test("unitario: devuelve solo los campos que usamos", async () => {
  const tx = await fetchWompiTransaction(TX.id, "pub_test_x", fakeFetch({ data: { ...TX, extra: 1 } }));
  assert.deepEqual(tx, TX);
});

test("seguridad: un id con formato raro ni siquiera se consulta", async () => {
  for (const id of ["../admin", "123", "1-2-3/../x", "abc-def-ghi", ""]) {
    const f = fakeFetch({ data: TX });
    assert.equal(await fetchWompiTransaction(id, "pub_test_x", f), null, id);
    assert.equal(f.calls.length, 0, id);
  }
});

test("unitario: error de Wompi, respuesta incompleta o fallo de red -> null", async () => {
  assert.equal(await fetchWompiTransaction(TX.id, "pub_test_x", fakeFetch({ data: TX }, { ok: false })), null);
  assert.equal(await fetchWompiTransaction(TX.id, "pub_test_x", fakeFetch({ data: { ...TX, amount_in_cents: "184" } })), null);
  assert.equal(await fetchWompiTransaction(TX.id, "pub_test_x", fakeFetch({})), null);
  const falla = async () => { throw new Error("sin red"); };
  assert.equal(await fetchWompiTransaction(TX.id, "pub_test_x", falla), null);
});

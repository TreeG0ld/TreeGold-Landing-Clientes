// Tests UNITARIOS de lib/auth.ts (firma/verificación de la sesión de admin).
// Prioridad: seguridad. Cubren cookie válida, expirada, manipulada, con firma
// inválida, ausente, con rol distinto de ADMIN y payload corrupto.
import test from "node:test";
import assert from "node:assert/strict";

process.env.ADMIN_SESSION_SECRET ??= "secreto-de-prueba-para-tests-1234567890";
const SECRET = process.env.ADMIN_SESSION_SECRET;

const {
  createSessionToken,
  verifySessionToken,
  timingSafeEqual,
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
} = await import("../lib/auth.ts");

// --- helpers: replican el formato del token para poder FORJAR casos límite ---
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Buffer.from(sig).toString("base64url");
}

async function forgeToken(payload, secret = SECRET) {
  const payloadB64 = Buffer.from(
    typeof payload === "string" ? payload : JSON.stringify(payload)
  ).toString("base64url");
  return `${payloadB64}.${await hmac(secret, payloadB64)}`;
}

// --- casos felices ---

test("unitario: token creado por createSessionToken se verifica y trae rol ADMIN", async () => {
  const token = await createSessionToken("santiago", "ADMIN");
  const session = await verifySessionToken(token);
  assert.ok(session, "el token recién creado debe ser válido");
  assert.equal(session.role, "ADMIN");
  assert.equal(session.userId, "santiago");
  assert.ok(session.exp > Date.now(), "exp debe estar en el futuro");
  assert.ok(
    session.exp <= Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000 + 1000,
    "exp no debe exceder el máximo configurado (8h)"
  );
});

test("unitario: el nombre de la cookie es estable (middleware y rutas dependen de él)", () => {
  assert.equal(ADMIN_COOKIE, "tg_session");
});

// --- cookie ausente / malformada ---

test("unitario: token ausente (undefined, null, vacío) -> null", async () => {
  assert.equal(await verifySessionToken(undefined), null);
  assert.equal(await verifySessionToken(null), null);
  assert.equal(await verifySessionToken(""), null);
});

test("unitario: token malformado (sin punto, con basura) -> null", async () => {
  assert.equal(await verifySessionToken("no-tiene-punto"), null);
  assert.equal(await verifySessionToken("solo-payload."), null);
  assert.equal(await verifySessionToken(".solo-firma"), null);
  assert.equal(await verifySessionToken("a.b.c.d"), null);
  assert.equal(await verifySessionToken("%%%.###"), null);
});

// --- manipulación ---

test("unitario: payload manipulado con la firma original -> null", async () => {
  const token = await createSessionToken("admin");
  const [, sig] = token.split(".");
  const evil = Buffer.from(
    JSON.stringify({ role: "ADMIN", user: "atacante", exp: Date.now() + 9e9 })
  ).toString("base64url");
  assert.equal(await verifySessionToken(`${evil}.${sig}`), null);
});

test("unitario: firma corrupta -> null", async () => {
  const token = await createSessionToken("admin");
  const [payload, sig] = token.split(".");
  const flipped = sig.slice(0, -2) + (sig.endsWith("AA") ? "BB" : "AA");
  assert.equal(await verifySessionToken(`${payload}.${flipped}`), null);
});

test("unitario: token firmado con OTRO secreto -> null", async () => {
  const forged = await forgeToken(
    { role: "ADMIN", user: "atacante", exp: Date.now() + 60_000 },
    "otro-secreto-distinto-al-del-servidor"
  );
  assert.equal(await verifySessionToken(forged), null);
});

// --- expiración y rol ---

test("unitario: token expirado (firma válida, exp en el pasado) -> null", async () => {
  const expired = await forgeToken({ role: "ADMIN", user: "admin", exp: Date.now() - 1000 });
  assert.equal(await verifySessionToken(expired), null);
});

test("unitario: verifySessionToken es genérico: acepta CLIENT válido (el gate ADMIN vive en admin-auth)", async () => {
  // Tras unificar cliente+admin, la verificación de firma/exp NO filtra por rol;
  // el acceso ADMIN se comprueba aparte en lib/admin-auth (requireAdminPage/Api).
  const client = await forgeToken({ role: "CLIENT", userId: "cliente", exp: Date.now() + 60_000 });
  const session = await verifySessionToken(client);
  assert.ok(session, "un token de cliente con firma válida debe verificarse");
  assert.equal(session.role, "CLIENT");
});

test("unitario: payload SIN exp (o exp no numérico) con firma válida -> null", async () => {
  // Sin esta defensa, `Date.now() > undefined` sería false y el token no expiraría nunca.
  const noExp = await forgeToken({ role: "ADMIN", user: "admin" });
  assert.equal(await verifySessionToken(noExp), null);
  const badExp = await forgeToken({ role: "ADMIN", user: "admin", exp: "9999999999999" });
  assert.equal(await verifySessionToken(badExp), null);
});

test("unitario: payload con firma válida pero que no es JSON -> null", async () => {
  const garbage = await forgeToken("esto no es json {{{");
  assert.equal(await verifySessionToken(garbage), null);
});

test("unitario: unicode/emojis en el nombre de usuario sobreviven el roundtrip", async () => {
  const token = await createSessionToken("adminÑ-🚀-ütf8", "ADMIN");
  const session = await verifySessionToken(token);
  assert.ok(session);
  assert.equal(session.userId, "adminÑ-🚀-ütf8");
});

// --- timingSafeEqual (comparación de credenciales en tiempo constante) ---

test("unitario: timingSafeEqual true solo para strings idénticos", async () => {
  assert.equal(await timingSafeEqual("clave-secreta", "clave-secreta"), true);
  assert.equal(await timingSafeEqual("clave-secreta", "clave-secretb"), false);
  assert.equal(await timingSafeEqual("corto", "mucho-mas-largo"), false);
  assert.equal(await timingSafeEqual("", ""), true);
  assert.equal(await timingSafeEqual("", "x"), false);
});

test("unitario: timingSafeEqual maneja unicode correctamente", async () => {
  assert.equal(await timingSafeEqual("cláve-Ñ-💎", "cláve-Ñ-💎"), true);
  assert.equal(await timingSafeEqual("cláve-Ñ-💎", "clave-N-💎"), false);
});

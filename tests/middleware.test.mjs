// Tests de INTEGRACIÓN del middleware (middleware.ts) ejecutando la función
// real con NextRequest/NextResponse de next/server. Cubren: acceso a /admin
// sin sesión (redirige), /admin/login (permite), /api/admin/* sin sesión
// (401 JSON), sesión válida (pasa), rol distinto de ADMIN y token expirado.
import test from "node:test";
import assert from "node:assert/strict";

process.env.ADMIN_SESSION_SECRET ??= "secreto-de-prueba-para-tests-1234567890";
const SECRET = process.env.ADMIN_SESSION_SECRET;

const { middleware } = await import("../middleware.ts");
const { createSessionToken, ADMIN_COOKIE } = await import("../lib/auth.ts");
const { NextRequest } = await import("next/server.js");

function makeRequest(path, token) {
  return new NextRequest(`http://localhost${path}`, {
    headers: token ? { cookie: `${ADMIN_COOKIE}=${token}` } : {},
  });
}

async function forgeToken(payload) {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${Buffer.from(sig).toString("base64url")}`;
}

function isPassThrough(res) {
  // NextResponse.next() marca la respuesta con este header interno.
  return res.headers.get("x-middleware-next") === "1";
}

// --- páginas /admin ---

test("integración: /admin/productos sin sesión -> redirige a /admin/login", async () => {
  const res = await middleware(makeRequest("/admin/productos"));
  assert.equal(res.status, 307);
  assert.equal(new URL(res.headers.get("location")).pathname, "/admin/login");
});

test("integración: /admin (raíz) sin sesión -> redirige a /admin/login", async () => {
  const res = await middleware(makeRequest("/admin"));
  assert.equal(res.status, 307);
  assert.equal(new URL(res.headers.get("location")).pathname, "/admin/login");
});

test("integración: la redirección al login no arrastra querystring (evita open-redirect/fugas)", async () => {
  const res = await middleware(makeRequest("/admin/productos?secreto=algo"));
  const loc = new URL(res.headers.get("location"));
  assert.equal(loc.search, "");
});

test("integración: /admin/login sin sesión -> se permite (no redirige)", async () => {
  const res = await middleware(makeRequest("/admin/login"));
  assert.ok(isPassThrough(res), "el login debe ser accesible sin sesión");
});

test("integración: /admin/login/ CON slash final NO se trata como el login (no hay bypass)", async () => {
  const res = await middleware(makeRequest("/admin/login/"));
  // La comparación es estricta con "/admin/login"; cualquier variante queda protegida.
  assert.equal(res.status, 307);
});

// --- APIs /api/admin ---

test("integración: /api/admin/products sin sesión -> 401 JSON", async () => {
  const res = await middleware(makeRequest("/api/admin/products"));
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.error, "No autorizado");
});

test("integración: /api/admin/cloudinary-signature sin sesión -> 401", async () => {
  const res = await middleware(makeRequest("/api/admin/cloudinary-signature"));
  assert.equal(res.status, 401);
});

test("integración: /api/admin/login sin sesión -> se permite (para poder loguearse)", async () => {
  const res = await middleware(makeRequest("/api/admin/login"));
  assert.ok(isPassThrough(res));
});

// --- con sesión ---

test("integración: sesión ADMIN válida -> pasa a /admin y /api/admin", async () => {
  const token = await createSessionToken("admin");
  assert.ok(isPassThrough(await middleware(makeRequest("/admin/productos", token))));
  assert.ok(isPassThrough(await middleware(makeRequest("/api/admin/products", token))));
});

test("integración: cookie con firma válida pero rol NO ADMIN -> rechazada", async () => {
  const token = await forgeToken({ role: "CLIENT", user: "x", exp: Date.now() + 60_000 });
  const page = await middleware(makeRequest("/admin/productos", token));
  assert.equal(page.status, 307, "página: debe redirigir al login");
  const api = await middleware(makeRequest("/api/admin/products", token));
  assert.equal(api.status, 401, "API: debe responder 401");
});

test("integración: cookie expirada -> rechazada", async () => {
  const token = await forgeToken({ role: "ADMIN", user: "x", exp: Date.now() - 1 });
  const res = await middleware(makeRequest("/admin/productos", token));
  assert.equal(res.status, 307);
});

test("integración: cookie con basura -> rechazada sin lanzar excepción", async () => {
  const res = await middleware(makeRequest("/admin/productos", "garbage.token"));
  assert.equal(res.status, 307);
});

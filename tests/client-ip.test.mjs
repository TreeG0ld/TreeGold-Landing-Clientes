// Tests UNITARIOS de lib/client-ip.ts — de dónde sale la identidad que usan las
// cubetas de rate limit del login y del registro. Prioridad: que una cabecera
// escrita por el cliente NUNCA determine la clave del bucket.
import test from "node:test";
import assert from "node:assert/strict";

const { clientIp } = await import("../lib/client-ip.ts");

function makeRequest(headers = {}) {
  return new Request("https://ejemplo.test/api/auth/login", { method: "POST", headers });
}

// Las rutas solo se ejecutan con NODE_ENV=production en el despliegue real, y
// es ahí donde el fail-closed importa. Se fuerza por test.
function inProduction(fn) {
  const previous = process.env.NODE_ENV;
  // NODE_ENV es de solo lectura en los tipos de Node, pero escribible en runtime.
  process.env.NODE_ENV = "production";
  try {
    return fn();
  } finally {
    process.env.NODE_ENV = previous;
  }
}

test("seguridad: cf-connecting-ip gana sobre un x-forwarded-for falsificado", () => {
  // Cloudflare APPENDEA la IP real al X-Forwarded-For que mande el cliente, así
  // que el primer elemento de esa lista lo escribe el atacante. Solo
  // cf-connecting-ip (que el edge sobrescribe) es de fiar.
  const ip = clientIp(
    makeRequest({
      "x-forwarded-for": "10.0.0.1, 203.0.113.9",
      "cf-connecting-ip": "203.0.113.9",
    })
  );
  assert.equal(ip, "203.0.113.9");
});

test("seguridad: rotar x-forwarded-for NO cambia la clave del bucket", () => {
  const primera = clientIp(
    makeRequest({ "x-forwarded-for": "10.0.0.1", "cf-connecting-ip": "203.0.113.9" })
  );
  const segunda = clientIp(
    makeRequest({ "x-forwarded-for": "10.0.7.42", "cf-connecting-ip": "203.0.113.9" })
  );
  assert.equal(primera, segunda, "el atacante no debe estrenar bucket cambiando la cabecera");
});

test("seguridad: x-real-ip por sí sola NO se acepta (Cloudflare no la pone)", () => {
  inProduction(() => {
    assert.equal(clientIp(makeRequest({ "x-real-ip": "10.0.0.1" })), null);
  });
});

test("seguridad: x-forwarded-for por sí sola NO se acepta sin proxy declarado", () => {
  inProduction(() => {
    assert.equal(clientIp(makeRequest({ "x-forwarded-for": "10.0.0.1, 10.0.0.2" })), null);
  });
});

test("seguridad: en producción sin cabecera de confianza -> null (fail-closed, no clave 'unknown')", () => {
  inProduction(() => {
    const ip = clientIp(makeRequest());
    assert.equal(ip, null, "no se inventa una identidad compartida por todo el mundo");
  });
});

test("unitario: x-vercel-forwarded-for se acepta y se toma el primer valor", () => {
  inProduction(() => {
    assert.equal(
      clientIp(makeRequest({ "x-vercel-forwarded-for": "203.0.113.7, 198.51.100.2" })),
      "203.0.113.7"
    );
  });
});

test("unitario: con TRUST_PROXY_XFF=1 se toma el ÚLTIMO valor de x-forwarded-for", () => {
  const previous = process.env.TRUST_PROXY_XFF;
  process.env.TRUST_PROXY_XFF = "1";
  try {
    inProduction(() => {
      // "10.0.0.1" lo puso el cliente; "198.51.100.5" lo puso el proxy inmediato.
      assert.equal(
        clientIp(makeRequest({ "x-forwarded-for": "10.0.0.1, 198.51.100.5" })),
        "198.51.100.5"
      );
    });
  } finally {
    if (previous === undefined) delete process.env.TRUST_PROXY_XFF;
    else process.env.TRUST_PROXY_XFF = previous;
  }
});

test("unitario: fuera de producción y sin proxy hay clave fija para poder probar en local", () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    assert.equal(clientIp(makeRequest()), "local");
  } finally {
    process.env.NODE_ENV = previous;
  }
});

test("unitario: cabeceras vacías o solo espacios no cuentan como IP válida", () => {
  inProduction(() => {
    assert.equal(clientIp(makeRequest({ "cf-connecting-ip": "   " })), null);
  });
});

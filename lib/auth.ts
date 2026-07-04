// Sesión de admin firmada con HMAC (Web Crypto), sin dependencias nuevas.
// Funciona tanto en el middleware (Edge) como en las rutas API (Node),
// porque solo usa APIs estándar (crypto.subtle, TextEncoder, btoa/atob).

export const AUTH_COOKIE = "tg_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas

export type UserSession = { role: "ADMIN" | "CLIENT"; userId: string; exp: number };

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Falta ADMIN_SESSION_SECRET en las variables de entorno.");
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array<ArrayBuffer> {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function importHmacKey(secret: string, usages: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages
  );
}

async function hmacSign(secret: string, data: string): Promise<Uint8Array> {
  const key = await importHmacKey(secret, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

async function hmacVerify(secret: string, data: string, signature: Uint8Array<ArrayBuffer>): Promise<boolean> {
  const key = await importHmacKey(secret, ["verify"]);
  return crypto.subtle.verify(
    "HMAC",
    key,
    signature as BufferSource,
    new TextEncoder().encode(data)
  );
}

// Crea el token de sesión
export async function createSessionToken(userId: string, role: "ADMIN" | "CLIENT"): Promise<string> {
  const payload: UserSession = {
    role,
    userId,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmacSign(getSecret(), payloadB64);
  return `${payloadB64}.${toBase64Url(sig)}`;
}

// Verifica el token
export async function verifySessionToken(token: string | undefined | null): Promise<UserSession | null> {
  if (!token) return null;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  try {
    const ok = await hmacVerify(getSecret(), payloadB64, fromBase64Url(sigB64));
    if (!ok) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payloadB64))
    ) as UserSession;

    // exp debe ser un número válido y estar en el futuro. Sin esta comprobación,
    // un payload sin exp haría `Date.now() > undefined === false` y nunca expiraría.
    // (No filtramos por rol aquí: esta verificación es genérica y también valida
    // sesiones de CLIENTE; el rol ADMIN se comprueba aparte en admin-auth.)
    if (typeof payload.exp !== "number" || Number.isNaN(payload.exp)) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Se exportan ambos nombres (cliente por BD y admin por env comparten el mismo
// mecanismo de sesión/cookie), para que compilen los archivos de las dos ramas.
export const AUTH_SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_SECONDS;
export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_SECONDS;
export const ADMIN_COOKIE = AUTH_COOKIE;

// Comparación en tiempo constante para credenciales: primero hashea ambos
// valores con SHA-256 (mismo largo siempre, no filtra la longitud real) y luego
// compara byte a byte sin cortar en la primera diferencia. Evita timing attacks
// sobre ADMIN_USER / ADMIN_PASSWORD.
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

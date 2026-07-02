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

function fromBase64Url(str: string): Uint8Array {
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

async function hmacVerify(secret: string, data: string, signature: Uint8Array): Promise<boolean> {
  const key = await importHmacKey(secret, ["verify"]);
  return crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(data));
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

    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export const AUTH_SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_SECONDS;

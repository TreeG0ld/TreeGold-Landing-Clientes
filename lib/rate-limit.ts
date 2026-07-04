// Rate limiter en memoria (por instancia del servidor). Suficiente para frenar
// la fuerza bruta contra el login de un único admin: no necesita Redis ni
// dependencias. Nota: en un despliegue con varias instancias el límite es por
// instancia; para el volumen de este panel es más que suficiente.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

// Barrido oportunista de buckets expirados para que el Map no crezca sin
// control en procesos de larga vida (se ejecuta ~2% de las llamadas).
function maybeSweep(now: number) {
  if (Math.random() >= 0.02) return;
  for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
}

// Registra un intento para `key` y dice si está permitido. Ventana fija: hasta
// `limit` intentos por `windowMs`; superado el límite, bloquea hasta que la
// ventana se reinicie.
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  maybeSweep(now);
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

// Limpia un bucket (p.ej. tras un login correcto, para no penalizar al admin
// legítimo por intentos previos fallidos).
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

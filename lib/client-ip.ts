// Identidad de red del cliente para las cubetas de rate limit. Vive aquí y no
// dentro de una ruta porque varias rutas (login, registro) necesitan la MISMA
// identidad para que sus cubetas hablen de lo mismo.
//
// REGLA: solo se usan cabeceras que el CLIENTE NO PUEDE FALSIFICAR.
//
// `x-forwarded-for` NO cumple esa regla en este despliegue. Se sirve por un
// quick tunnel de Cloudflare (cloudflared -> http://localhost:3000, ver
// cloudflare.log) y Cloudflare, cuando la petición YA trae `X-Forwarded-For`,
// AÑADE la IP del visitante al final del valor existente en vez de reescribirlo.
// Es decir: el primer elemento de la lista lo escribe el atacante. Leer
// `split(",")[0]` convertía el rate limit por IP en decorativo (una cabecera
// distinta por petición = una cubeta nueva por petición) y además permitía
// quemarle el cupo a una víctima poniendo su IP.
//
// La única cabecera de confianza detrás de Cloudflare es `cf-connecting-ip`: la
// pone el edge y sobrescribe cualquier valor que mande el cliente. En Vercel el
// equivalente es `x-vercel-forwarded-for`.
//
// Si el origen dejara de estar detrás de un proxy conocido, `clientIp` devuelve
// `null` (fail-closed): las rutas deben rechazar la petición en vez de meter a
// todo el mundo en una única cubeta compartida con clave "unknown", que era lo
// que hacía antes y que en cuanto el proxy dejara de mandar la cabecera cerraba
// el login para TODOS los usuarios a la vez.
//
// Escape hatch para un proxy propio (nginx/Caddy delante del origen, con el
// origen NO alcanzable directamente): poner TRUST_PROXY_XFF=1 y entonces sí se
// lee `x-forwarded-for`, pero el ÚLTIMO elemento — el que escribió el proxy
// inmediato — nunca el primero, que es el que controla el cliente.

const DEV_FALLBACK_KEY = "local";

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

// Colapsa una IPv6 a su prefijo /64 para usarla como clave de rate limit.
// Un ISP típico asigna un /64 (o más) por cliente, así que usar la dirección
// completa le da a cualquier usuario normal 2^64 identidades distintas —
// suficientes para no chocar nunca con su propio límite. Las direcciones
// IPv4 se devuelven tal cual (no tienen ese problema de asignación).
export function rateLimitIp(ip: string): string {
  if (!ip.includes(":")) return ip;
  const groups = ip.split(":");
  // División simplificada: no expande "::" a los grupos de ceros que omite,
  // así que una IPv6 corta puede quedar con menos de 4 grupos reales antes
  // del "::". Es una aproximación deliberadamente conservadora (agrupa DE
  // MÁS, nunca de menos), preferible a decodificar la abreviatura completa
  // solo para una clave de rate limit.
  return groups.slice(0, 4).join(":") + "::/64";
}

// Cualquier objeto con el mismo .get() que Headers/Request.headers sirve:
// tanto Request.headers (rutas API) como el ReadonlyHeaders que devuelve
// next/headers en un Server Component (la página de mayoristas) lo cumplen.
type HeaderSource = { get(name: string): string | null | undefined };

export function clientIpFromHeaders(h: HeaderSource): string | null {
  // Cloudflare (despliegue actual). No falsificable: el edge la reescribe.
  const cf = clean(h.get("cf-connecting-ip"));
  if (cf) return cf;

  // Vercel, por si el día de mañana se migra el hosting.
  const vercel = clean(h.get("x-vercel-forwarded-for")?.split(",")[0]);
  if (vercel) return vercel;

  // Proxy propio declarado explícitamente por configuración.
  if (process.env.TRUST_PROXY_XFF === "1") {
    const parts = h.get("x-forwarded-for")?.split(",") ?? [];
    const last = clean(parts[parts.length - 1]);
    if (last) return last;
  }

  // Desarrollo local sin túnel: no hay proxy, así que tampoco hay cabecera de
  // confianza. Se agrupa todo bajo una clave fija para poder probar el rate
  // limit en local, pero SOLO fuera de producción.
  if (process.env.NODE_ENV !== "production") return DEV_FALLBACK_KEY;

  // En producción sin cabecera de confianza no se inventa una identidad.
  return null;
}

export function clientIp(req: Request): string | null {
  return clientIpFromHeaders(req.headers);
}

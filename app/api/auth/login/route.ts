import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, AUTH_COOKIE, AUTH_SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { rateLimit, resetRateLimit, refundRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

// Este es el ÚNICO login del sitio: también entra por aquí el admin, que no es
// una variable de entorno sino una fila de la tabla User con role ADMIN y su
// contraseña hasheada con bcrypt (ver scripts/seed-admin.mjs). Por eso la
// protección contra fuerza bruta tiene que vivir aquí.

// Dos cubetas independientes porque frenan ataques DISTINTOS:
// - Por IP: un atacante único probando muchas contraseñas contra lo que sea.
// - Por cuenta: un ataque distribuido desde muchas IPs (botnet, proxies
//   rotativos) contra UNA cuenta concreta, típicamente la del admin. El límite
//   por IP no lo ve porque cada IP hace pocos intentos.
const IP_MAX_ATTEMPTS = 10;
const IP_WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const ACCOUNT_MAX_ATTEMPTS = 8;
const ACCOUNT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

// Respuesta 429 única para AMBAS cubetas. Es deliberado que el texto sea
// idéntico exista o no la cuenta: si el mensaje (o el simple hecho de recibir
// un 429 por cuenta) dependiera de que el correo esté en la base de datos, el
// bloqueo se convertiría en un oráculo de enumeración de usuarios.
function tooManyAttempts(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return NextResponse.json(
    {
      error: `Demasiados intentos de inicio de sesión. Vuelve a intentarlo en ${minutes} ${
        minutes === 1 ? "minuto" : "minutos"
      }.`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

export async function POST(req: Request) {
  try {
    // Cubeta por IP primero: si esta IP ya está bloqueada cortamos aquí sin
    // tocar la cubeta de la cuenta, para que un atacante no pueda gastar el
    // cupo de una cuenta ajena (y dejar fuera a su dueño) desde una IP que ya
    // está frenada.
    // Sin una IP de confianza no hay rate limit posible: se rechaza en vez de
    // meter a todo el mundo en una cubeta compartida (ver lib/client-ip.ts).
    const ip = clientIp(req);
    if (!ip) {
      return NextResponse.json(
        { error: "No se pudo procesar la petición. Inténtalo de nuevo más tarde." },
        { status: 503 }
      );
    }

    const ipKey = `login:ip:${ip}`;
    const ipLimit = rateLimit(ipKey, IP_MAX_ATTEMPTS, IP_WINDOW_MS);
    if (!ipLimit.allowed) return tooManyAttempts(ipLimit.retryAfterSeconds);

    const { email, password } = await req.json();

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json({ error: "Faltan credenciales." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // El cupo se consume ANTES de validar las credenciales, y se crea aunque el
    // correo no exista en la base de datos: contar solo cuentas reales haría
    // que "recibir 429" revelase que la cuenta existe.
    // Contrapartida asumida: alguien puede dejar una cuenta bloqueada 15 min
    // gastándole el cupo. Se prefiere eso a dejar el login abierto a fuerza
    // bruta distribuida; el bloqueo es temporal y se limpia al entrar bien.
    const accountKey = `login:account:${normalizedEmail}`;
    const accountLimit = rateLimit(accountKey, ACCOUNT_MAX_ATTEMPTS, ACCOUNT_WINDOW_MS);
    if (!accountLimit.allowed) return tooManyAttempts(accountLimit.retryAfterSeconds);

    const dbUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // verifyPassword ejecuta bcrypt SIEMPRE, exista o no el usuario (contra un
    // hash señuelo del mismo coste cuando no hay contraseña que comparar). Así
    // los dos caminos cuestan lo mismo (~65 ms) y el tiempo de respuesta deja
    // de decir si el correo está dado de alta. El orden importa: la
    // comprobación de `dbUser` va DESPUÉS de la comparación, nunca antes.
    const isValid = await verifyPassword(password, dbUser?.password);

    if (!dbUser || !isValid) {
      return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
    }

    // Login correcto.
    // La cubeta de la CUENTA sí se limpia: la petición acaba de demostrar que
    // quien la hace es el dueño, así que los fallos previos (suyos o de quien
    // intentaba bloquearle la cuenta) dejan de contar.
    resetRateLimit(accountKey);
    // La cubeta de la IP NO se limpia nunca desde una petición. Si se limpiara,
    // bastaría una cuenta propia válida para poner el contador a cero cada 10
    // peticiones y hacer password spraying ilimitado contra cuentas ajenas
    // desde una única IP, sin falsificar ninguna cabecera. Se devuelve solo el
    // intento que ESTA petición consumió, para no cobrarle al usuario legítimo
    // sus entradas correctas; los intentos fallidos siguen contando.
    refundRateLimit(ipKey);

    const token = await createSessionToken(dbUser.id, dbUser.role);
    const res = NextResponse.json({ ok: true, role: dbUser.role });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    });

    return res;
  } catch {
    // Sin detalles del error: cualquier fuga aquí ayuda a mapear la base de datos.
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

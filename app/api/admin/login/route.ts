import { NextResponse } from "next/server";
import {
  createSessionToken,
  timingSafeEqual,
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";

// Máximo de intentos fallidos por IP antes de bloquear temporalmente.
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutos

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const key = `login:${ip}`;

  // Freno de fuerza bruta: se cuenta ANTES de validar, así los intentos
  // fallidos consumen cupo aunque las credenciales sean incorrectas.
  const limit = rateLimit(key, MAX_ATTEMPTS, WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const { user, password } = await req
    .json()
    .catch(() => ({ user: "", password: "" }));

  const validUser = process.env.ADMIN_USER;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validUser || !validPassword) {
    return NextResponse.json(
      { error: "El panel no está configurado (faltan ADMIN_USER/ADMIN_PASSWORD)." },
      { status: 500 }
    );
  }

  // Se evalúan ambas comparaciones siempre (sin cortocircuito) para no revelar
  // por tiempo si el que falló fue el usuario o la contraseña.
  const [userOk, passOk] = await Promise.all([
    timingSafeEqual(String(user ?? ""), validUser),
    timingSafeEqual(String(password ?? ""), validPassword),
  ]);

  if (!userOk || !passOk) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  // Login correcto: limpiamos el contador para no penalizar al admin legítimo.
  resetRateLimit(key);

  const token = await createSessionToken(validUser, "ADMIN");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return res;
}

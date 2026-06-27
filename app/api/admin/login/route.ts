import { NextResponse } from "next/server";
import { createSessionToken, ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export async function POST(req: Request) {
  const { user, password } = await req.json().catch(() => ({ user: "", password: "" }));

  const validUser = process.env.ADMIN_USER;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validUser || !validPassword) {
    return NextResponse.json(
      { error: "El panel no está configurado (faltan ADMIN_USER/ADMIN_PASSWORD)." },
      { status: 500 }
    );
  }

  if (user !== validUser || password !== validPassword) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  const token = await createSessionToken(user);
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

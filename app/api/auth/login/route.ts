import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSessionToken, AUTH_COOKIE, AUTH_SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Faltan credenciales." }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!dbUser || !dbUser.password) {
      return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, dbUser.password);
    
    if (!isValid) {
      return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
    }

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
  } catch (err: any) {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

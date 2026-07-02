import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSessionToken, AUTH_COOKIE, AUTH_SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: "El correo ya está registrado." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        role: "CLIENT",
      },
    });

    const token = await createSessionToken(newUser.id, "CLIENT");
    const res = NextResponse.json({ ok: true });
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

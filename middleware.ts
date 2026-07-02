import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

// Protege todo /admin/* (excepto /admin/login) verificando la sesión firmada
// y exigiendo explícitamente rol ADMIN. Es la primera barrera; cada ruta API
// de admin vuelve a validar por su cuenta (defensa en profundidad).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session || session.role !== "ADMIN") {
    // Las rutas API responden 401 en JSON; las páginas redirigen al login.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

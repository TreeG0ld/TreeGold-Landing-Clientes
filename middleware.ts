import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";

// Protege todo /admin/* (excepto /admin/login) verificando la sesión firmada
// y exigiendo explícitamente rol ADMIN. Es la primera barrera; cada ruta API
// de admin vuelve a validar por su cuenta (defensa en profundidad).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /perfil y /login (cuentas de clientes): la redirección según haya sesión
  // se hace AQUÍ y no solo en la página. Con redirect() dentro de la página,
  // al tocar el ícono de perfil el navegador pintaba /perfil vacío ~0,6 s
  // (solo la barra y el pie de página) antes de llegar a /login; redirigiendo
  // desde el middleware recibe /login directamente. Las páginas siguen
  // verificando por su cuenta (p. ej. /perfil comprueba que el usuario exista
  // en la base de datos). Ninguna de las dos exige rol: no tocan el admin.
  if (pathname === "/perfil" || pathname === "/login") {
    const session = await verifySessionToken(req.cookies.get(AUTH_COOKIE)?.value);
    const destino = pathname === "/perfil" && !session ? "/login"
      : pathname === "/login" && session ? "/perfil"
      : null;
    if (!destino) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = destino;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Solo la PÁGINA de login queda fuera: el formulario envía a /api/auth/login,
  // que no cae en este matcher. No hay ninguna API bajo /api/admin que deba ser
  // accesible sin sesión, así que cualquier excepción aquí sería una puerta
  // abierta sin motivo.
  if (pathname === "/admin/login") {
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
  matcher: ["/admin/:path*", "/api/admin/:path*", "/perfil", "/login"],
};

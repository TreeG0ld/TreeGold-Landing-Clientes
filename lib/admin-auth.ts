import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken, type AdminSession } from "@/lib/auth";

// Lee y valida la sesión de admin desde la cookie. Úsalo en Server Components
// y Route Handlers (ambos corren en Node, donde next/headers está disponible).
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  return verifySessionToken(token);
}

// Para páginas: si no hay sesión ADMIN válida, redirige al login.
// (El middleware ya protege la ruta; esto es una segunda verificación a nivel
// de datos, por si la página se invoca de otra forma).
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") redirect("/admin/login");
  return session;
}

// Para rutas API: devuelve la sesión o null (el caller responde 401 si es null).
export async function requireAdminApi(): Promise<AdminSession | null> {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

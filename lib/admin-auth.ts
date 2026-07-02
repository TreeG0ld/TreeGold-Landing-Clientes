import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, verifySessionToken, type UserSession } from "@/lib/auth";

export async function getAdminSession(): Promise<UserSession | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  return verifySessionToken(token);
}

// Para páginas: si no hay sesión ADMIN válida, redirige al login.
// (El middleware ya protege la ruta; esto es una segunda verificación a nivel
// de datos, por si la página se invoca de otra forma).
export async function requireAdminPage(): Promise<UserSession> {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") redirect("/admin/login");
  return session;
}

// Para rutas API: devuelve la sesión o null (el caller responde 401 si es null).
export async function requireAdminApi(): Promise<UserSession | null> {
  const session = await getAdminSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

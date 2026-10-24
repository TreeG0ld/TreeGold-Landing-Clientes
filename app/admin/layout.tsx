import { cookies } from "next/headers";
import AdminTheme from "@/components/admin/AdminTheme";
import { ADMIN_THEME_COOKIE, parseAdminTheme } from "@/lib/admin-theme";

// Envuelve todo /admin (también el login) con el tema claro / oscuro. Se lee
// la cookie en el servidor para que la página llegue ya pintada con el tema
// elegido, sin destello (ver lib/admin-theme.ts).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const theme = parseAdminTheme((await cookies()).get(ADMIN_THEME_COOKIE)?.value);
  return <AdminTheme initial={theme}>{children}</AdminTheme>;
}

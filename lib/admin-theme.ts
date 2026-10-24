// Tema (claro / oscuro) del panel /admin.
//
// Se guarda en una cookie y no en localStorage para que el servidor pinte la
// página ya con el tema elegido: con localStorage el panel se dibujaba claro y
// cambiaba a oscuro al cargar el JavaScript, con un destello blanco. La cookie
// solo viaja a /admin (path), así que la tienda pública ni se entera.
//
// Vive en un módulo aparte (sin "use client") porque lo leen tanto el layout de
// servidor como el interruptor del navegador.

export const ADMIN_THEME_COOKIE = "tg_admin_theme";

export type AdminThemeName = "light" | "dark";

export function parseAdminTheme(value: string | undefined): AdminThemeName {
  return value === "dark" ? "dark" : "light";
}

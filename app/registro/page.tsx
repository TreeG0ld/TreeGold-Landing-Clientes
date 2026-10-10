import { redirect } from "next/navigation";

// El registro de clientes está cerrado (ver /api/auth/register): quien llegue
// aquí por un enlace viejo va al inicio.
export default function RegisterPage() {
  redirect("/");
}

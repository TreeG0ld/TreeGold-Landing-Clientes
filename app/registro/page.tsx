import { cookies } from "next/headers";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClientRegisterForm from "./ClientRegisterForm";

export default async function RegisterPage() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (session) {
    redirect("/perfil");
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-background px-5 pt-20">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-sm">
        <h1 className="font-serif text-2xl text-primary mb-1">Crea tu Cuenta</h1>
        <p className="text-sm text-secondary mb-6">Únete a TreeGold para tus compras.</p>
        <ClientRegisterForm />
      </div>
    </div>
  );
}

import Image from "next/image";
import { cookies } from "next/headers";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClientLoginForm from "./ClientLoginForm";

export default async function LoginPage() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (session) {
    redirect("/perfil");
  }

  return (
    <div className="relative -mb-24 flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden bg-background px-5 pt-20">
      {/* Gradiente dorado en la parte inferior — igual que /admin/login.
          "-mb-24" cancela el margen del Footer (mt-24, que el login de admin
          no tiene por ser una página sin Navbar/Footer) para que no quede una
          franja plana entre el gradiente y el Footer. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-accent/30 via-accent-soft/10 to-transparent"
      />

      <div className="relative w-full max-w-md rounded-3xl border border-border bg-white p-10 shadow-lg sm:p-12">
        <div className="flex justify-center">
          <Image src="/logo.png" alt="TreeGold" width={820} height={876} priority className="h-20 w-auto" />
        </div>

        <h1 className="mt-5 text-center font-serif text-3xl text-primary">Iniciar Sesión</h1>
        <p className="mt-2 text-center text-sm text-secondary">Accede a tu cuenta de TreeGold.</p>

        <div className="mt-8">
          <ClientLoginForm />
        </div>
      </div>
    </div>
  );
}

import { cookies } from "next/headers";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./LogoutButton";

export default async function PerfilPage() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-24 md:py-32">
      <h1 className="font-serif text-3xl text-primary md:text-4xl mb-8">Mi Perfil</h1>
      
      <div className="rounded-2xl border border-border bg-white p-6 md:p-10 shadow-sm">
        <div className="flex flex-col gap-4 mb-8 border-b border-border pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-medium text-primary mb-2">Datos Personales</h2>
            <p className="text-secondary"><strong className="text-primary">Nombre:</strong> {user.name}</p>
            <p className="text-secondary break-words"><strong className="text-primary">Email:</strong> {user.email}</p>
            <p className="text-secondary"><strong className="text-primary">Rol:</strong> {user.role === "ADMIN" ? "Administrador" : "Cliente"}</p>
          </div>
          <div className="shrink-0">
            <LogoutButton />
          </div>
        </div>

        {user.role === "ADMIN" && (
          <div className="mb-8">
            <h2 className="text-xl font-medium text-primary mb-4">Panel de Administración</h2>
            <p className="text-secondary mb-4">Tienes permisos de administrador. Puedes acceder al panel de control para gestionar el catálogo.</p>
            <a href="/admin/productos" className="btn-primary inline-block">
              Ir al Panel de Administrador
            </a>
          </div>
        )}

        <div>
          <h2 className="text-xl font-medium text-primary mb-4">Mis Compras</h2>
          <p className="text-secondary">Próximamente podrás ver aquí el historial de tus pedidos.</p>
        </div>
      </div>
    </div>
  );
}

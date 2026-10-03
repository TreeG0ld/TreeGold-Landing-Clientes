import { requireAdminPage } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminPage();

  // La sesión solo guarda el id; buscamos el nombre/email para mostrarlo bonito.
  // (Si el admin entró por variables de entorno, no habrá fila en la BD y se
  // muestra el propio identificador.)
  const dbUser = await prisma.user
    .findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    })
    .catch(() => null);
  const display = dbUser?.name || dbUser?.email || session.userId;

  return (
    <div className="min-h-dvh bg-muted/30">
      <AdminNav user={display} />
      {/* max-w-screen-2xl (1536px) y no max-w-6xl (1152px): las tablas del
          panel tienen muchas columnas y en pantallas grandes sobraba espacio
          a los lados. AdminNav usa el mismo ancho para quedar alineado. */}
      <main className="mx-auto max-w-screen-2xl px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}

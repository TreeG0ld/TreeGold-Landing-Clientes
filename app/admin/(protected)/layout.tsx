import { requireAdminPage } from "@/lib/admin-auth";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminPage();

  return (
    <div className="min-h-dvh bg-muted/30">
      <AdminNav user={session.user} />
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}

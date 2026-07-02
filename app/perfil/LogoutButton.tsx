"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-secondary transition-colors hover:border-accent hover:text-primary cursor-pointer"
    >
      <LogOut className="h-4 w-4" />
      Cerrar Sesión
    </button>
  );
}

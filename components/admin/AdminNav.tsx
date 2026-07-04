"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Package, Tags, Store } from "lucide-react";

const links = [
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tags },
  { href: "/admin/mayoristas", label: "Mayoristas", icon: Store },
];

export default function AdminNav({ user }: { user: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <div className="flex items-center gap-6">
          <span className="font-serif text-lg text-primary">TreeGold · Admin</span>
          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-primary text-white" : "text-secondary hover:text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm text-secondary">
          <span>{user}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 font-medium text-secondary transition-colors hover:border-accent hover:text-primary cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </div>
    </header>
  );
}

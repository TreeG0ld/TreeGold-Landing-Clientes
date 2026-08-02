"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      router.push("/admin/productos");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-5">
      {/* Gradiente dorado en la parte inferior */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-accent/30 via-accent-soft/10 to-transparent"
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-3xl border border-border bg-white p-10 shadow-lg sm:p-12"
      >
        <div className="flex justify-center">
          <Image src="/logo.png" alt="TreeGold" width={820} height={876} priority className="h-20 w-auto" />
        </div>

        <h1 className="mt-5 text-center font-serif text-3xl text-primary">Panel TreeGold</h1>
        <p className="mt-2 text-center text-sm text-secondary">Acceso restringido al administrador.</p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary">Correo / Usuario</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-8 w-full disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <Link
        href="/"
        className="group relative mt-8 inline-flex items-center gap-2 overflow-hidden rounded-full border border-accent/30 bg-white/60 px-6 py-2.5 text-sm font-medium text-primary shadow-sm backdrop-blur transition-all duration-300 ease-luxe hover:border-accent hover:bg-white hover:shadow-md"
      >
        <ArrowLeft className="h-4 w-4 text-accent transition-transform duration-300 ease-luxe group-hover:-translate-x-1" />
        Volver a la tienda
      </Link>
    </div>
  );
}

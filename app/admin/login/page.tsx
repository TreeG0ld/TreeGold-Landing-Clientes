"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
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
    <div className="flex min-h-dvh items-center justify-center bg-background px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-sm"
      >
        <h1 className="font-serif text-2xl text-primary">Panel TreeGold</h1>
        <p className="mt-1 text-sm text-secondary">Acceso restringido al administrador.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary">Usuario</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoComplete="username"
              required
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
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
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-6 w-full disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

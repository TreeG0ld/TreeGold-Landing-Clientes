"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ClientLoginForm() {
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
      if (data.role === "ADMIN") {
        router.push("/admin/productos");
      } else {
        router.push("/perfil");
      }
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-primary">Correo o Usuario</label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          required
          className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
        {loading ? "Entrando..." : "Entrar"}
      </button>
      <p className="text-center text-sm text-secondary mt-4">
        ¿No tienes cuenta? <Link href="/registro" className="text-accent hover:underline">Regístrate</Link>
      </p>
    </form>
  );
}

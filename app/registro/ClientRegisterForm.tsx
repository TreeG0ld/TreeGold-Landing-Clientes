"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ClientRegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo registrar.");
        return;
      }
      router.push("/perfil");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-primary">Nombre Completo</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-primary">Correo Electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          required
          // Debe coincidir con PASSWORD_MIN de /api/auth/register: si el cliente
          // deja pasar menos, el usuario recibe un error del servidor que podría
          // haberse evitado antes de enviar.
          minLength={8}
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
        />
        <p className="mt-1.5 text-xs text-secondary">Mínimo 8 caracteres</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
        {loading ? "Creando cuenta..." : "Crear Cuenta"}
      </button>
      <p className="text-center text-sm text-secondary mt-4">
        ¿Ya tienes cuenta? <Link href="/login" className="text-accent hover:underline">Inicia Sesión</Link>
      </p>
    </form>
  );
}

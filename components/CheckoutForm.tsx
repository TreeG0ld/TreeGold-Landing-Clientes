"use client";

import { useId, useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import type { SelectionItem } from "@/lib/store";
import { DEPARTAMENTOS, CHECKOUT_LIMITS } from "@/lib/checkout";
import GlassSelect from "@/components/admin/GlassSelect";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent";
const labelClass = "mb-1.5 block text-sm font-medium text-primary";

// Datos de contacto y envío -> /api/checkout -> redirección a Wompi. Los
// límites y la lista de departamentos vienen de lib/checkout.ts, los mismos
// que valida el servidor.
export default function CheckoutForm({
  items,
  onCancel,
}: {
  items: SelectionItem[];
  onCancel: () => void;
}) {
  const id = useId();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    city: "",
    address: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // El menú de departamentos no es un <select> nativo, así que `required`
    // no aplica: se revisa aquí (el servidor también lo valida).
    if (!form.department) {
      setError("Elige tu departamento.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Solo código y cantidad: el precio lo pone el servidor.
        body: JSON.stringify({
          items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
          customer: form,
        }),
      });
      const data = await res.json();
      if (!res.ok || typeof data.url !== "string") {
        setError(data.error ?? "No se pudo iniciar el pago.");
        setLoading(false);
        return;
      }
      // loading se queda en true: la página se va a Wompi.
      window.location.assign(data.url);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1 text-sm text-secondary transition-colors hover:text-accent cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>
      <h3 className="font-serif text-xl">Datos de envío</h3>

      <div>
        <label htmlFor={`${id}-name`} className={labelClass}>Nombre completo</label>
        <input
          id={`${id}-name`}
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={set("name")}
          required
          minLength={2}
          maxLength={CHECKOUT_LIMITS.name}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={`${id}-email`} className={labelClass}>Correo electrónico</label>
        <input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set("email")}
          required
          maxLength={CHECKOUT_LIMITS.email}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={`${id}-phone`} className={labelClass}>Celular</label>
        <input
          id={`${id}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="300 123 4567"
          value={form.phone}
          onChange={set("phone")}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={`${id}-department`} className={labelClass}>Departamento</label>
        {/* El mismo menú de vidrio que usa el resto de la app: el <select>
            nativo mostraba la lista gris y azul del sistema operativo. */}
        <GlassSelect
          id={`${id}-department`}
          value={form.department}
          onChange={(v) => setForm((f) => ({ ...f, department: v }))}
          placeholder="Elige…"
          surface="bg-background"
          options={DEPARTAMENTOS.map((d) => ({ value: d, label: d }))}
        />
      </div>
      <div>
        <label htmlFor={`${id}-city`} className={labelClass}>Ciudad o municipio</label>
        <input
          id={`${id}-city`}
          type="text"
          autoComplete="address-level2"
          value={form.city}
          onChange={set("city")}
          required
          minLength={2}
          maxLength={CHECKOUT_LIMITS.city}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={`${id}-address`} className={labelClass}>Dirección</label>
        <input
          id={`${id}-address`}
          type="text"
          autoComplete="street-address"
          placeholder="Calle 10 # 20 - 30"
          value={form.address}
          onChange={set("address")}
          required
          minLength={5}
          maxLength={CHECKOUT_LIMITS.address}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor={`${id}-notes`} className={labelClass}>
          Indicaciones <span className="font-normal text-secondary/70">(opcional)</span>
        </label>
        <textarea
          id={`${id}-notes`}
          placeholder="Barrio, apartamento, punto de referencia"
          value={form.notes}
          onChange={set("notes")}
          rows={2}
          maxLength={CHECKOUT_LIMITS.notes}
          className={inputClass}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
        <Lock className="h-4 w-4" />
        {loading ? "Conectando con Wompi…" : "Ir a pagar"}
      </button>
      <p className="text-xs text-secondary/60">
        Usamos estos datos solo para procesar y enviar tu pedido. El pago se hace en la página
        segura de Wompi (Bancolombia); nosotros no vemos los datos de tu tarjeta.
      </p>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

type Category = { id: string; name: string; slug: string; _count: { products: number } };

export default function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al crear.");
        return;
      }
      setNewName("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    setError("");
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al renombrar.");
      return;
    }
    setEditingId(null);
    router.refresh();
  };

  const handleDelete = async (id: string, name: string, count: number) => {
    if (count > 0) {
      alert(`No se puede eliminar "${name}": tiene ${count} producto(s) asociados.`);
      return;
    }
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Error al eliminar.");
      return;
    }
    router.refresh();
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="mb-6 flex gap-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre de la nueva categoría..."
          className="flex-1 max-w-sm rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-secondary">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  {editingId === c.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="rounded-lg border border-border px-2.5 py-1 text-sm outline-none focus:border-accent"
                    />
                  ) : (
                    <span className="font-medium text-primary">{c.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-secondary">{c.slug}</td>
                <td className="px-4 py-3 text-secondary">{c._count.products}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === c.id ? (
                      <>
                        <button onClick={() => handleRename(c.id)} aria-label="Guardar" className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:bg-muted hover:text-primary cursor-pointer">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} aria-label="Cancelar" className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:bg-muted hover:text-primary cursor-pointer">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(c.id); setEditName(c.name); }}
                          aria-label="Renombrar"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:bg-muted hover:text-primary cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name, c._count.products)}
                          aria-label="Eliminar"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

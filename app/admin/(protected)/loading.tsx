// Skeleton genérico del panel admin: título + tarjeta con filas tipo tabla.
// Cubre Productos, Categorías y Mayoristas mientras el servidor consulta.
export default function AdminLoading() {
  return (
    <div>
      <div className="skeleton mb-6 h-9 w-48" />

      <div className="mb-4 flex gap-2">
        <div className="skeleton h-10 w-64 rounded-xl" />
        <div className="skeleton h-10 w-40 rounded-xl" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="skeleton h-4 w-56" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="cascade flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
            style={{ "--i": i } as React.CSSProperties}
          >
            <div className="skeleton h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-3 w-1/5" />
            </div>
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-14" />
            <div className="skeleton h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

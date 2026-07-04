// Skeleton del catálogo: se muestra al instante mientras el servidor
// consulta los productos, y luego las tarjetas reales entran en cascada.
export default function ColeccionLoading() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
      {/* Encabezado */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-12 w-72 max-w-full" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>

      {/* Barra de filtros */}
      <div className="mb-10 flex items-center gap-2 overflow-hidden rounded-2xl border border-border px-5 py-3.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Grid de tarjetas */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="cascade" style={{ "--i": i } as React.CSSProperties}>
            <div className="skeleton aspect-[4/5] w-full rounded-2xl" />
            <div className="mt-4 space-y-2 px-1">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

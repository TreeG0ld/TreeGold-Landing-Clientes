// Skeleton de la tienda mayorista (neutro, sin marca, como la página).
export default function WholesaleLoading() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Cabecera oscura */}
      <div className="bg-primary">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
          <div className="skeleton mb-4 h-7 w-40 rounded-full opacity-20" />
          <div className="skeleton h-12 w-80 max-w-full opacity-20" />
          <div className="skeleton mt-4 h-4 w-96 max-w-full opacity-20" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 pb-20 md:px-8">
        {/* Filtros */}
        <div className="mt-6 flex gap-2 overflow-hidden rounded-full border border-border px-4 py-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 pt-10 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="cascade" style={{ "--i": i } as React.CSSProperties}>
              <div className="skeleton aspect-[4/5] w-full rounded-2xl" />
              <div className="mt-4 space-y-2 px-1">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-8 w-36 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

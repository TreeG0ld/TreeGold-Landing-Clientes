// Skeleton del detalle de producto: se pinta al instante al hacer clic en una
// tarjeta, mientras el servidor consulta el producto. Sin esto el navegador se
// queda en la página anterior hasta que termina la consulta (sensación de
// "no pasó nada"). Espeja la maqueta de ProductDetail para que el cambio al
// contenido real no mueva la página.
export default function ProductoLoading() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-24 md:px-8 md:pt-32">
      {/* Volver a la colección */}
      <div className="skeleton mb-6 h-4 w-44" />

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Galería */}
        <div>
          <div className="skeleton aspect-square w-full rounded-3xl" />
          <div className="mt-4 flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-20 w-20 shrink-0 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="lg:pt-6">
          <div className="skeleton h-3 w-40" />
          <div className="skeleton mt-3 h-11 w-4/5" />
          <div className="skeleton mt-4 h-8 w-48" />
          <div className="skeleton mt-2 h-3 w-64 max-w-full" />

          <div className="mt-6 space-y-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>

          {/* Acciones */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <div className="skeleton h-[52px] flex-1 rounded-full" />
            <div className="skeleton h-[52px] flex-1 rounded-full" />
          </div>

          {/* Detalles */}
          <div className="mt-10 border-t border-border pt-8">
            <div className="skeleton h-7 w-32" />
            <div className="mt-4 space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-4 w-56 max-w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

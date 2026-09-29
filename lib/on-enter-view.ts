// Llama a `onEnter` una sola vez, cuando el borde superior de `el` sube hasta
// `startPct` de la altura de la pantalla (0.85 = "top 85%" en ScrollTrigger).
//
// Reemplaza a ScrollTrigger en las animaciones de aparición: ScrollTrigger mide
// la página entera al arrancar (PageSpeed lo marcaba como ~100 ms de
// "redistribución forzada") y suma ~40 KB de JavaScript. IntersectionObserver
// viene en el navegador y no obliga a recalcular el diseño.
//
// Devuelve la función para dejar de observar.
export function onEnterView(
  el: Element,
  startPct: number,
  onEnter: () => void
): () => void {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        // `bottom < 0`: el elemento ya quedó ARRIBA de la pantalla (p. ej. al
        // recargar a mitad de página). ScrollTrigger lo mostraba igual; sin
        // esto se quedaría invisible para siempre.
        if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
          io.disconnect();
          onEnter();
          return;
        }
      }
    },
    // Recorta la parte baja de la pantalla: el elemento cuenta como visible
    // recién cuando su borde superior pasa del `startPct`.
    { rootMargin: `0px 0px -${Math.round((1 - startPct) * 100)}% 0px` }
  );
  io.observe(el);
  return () => io.disconnect();
}

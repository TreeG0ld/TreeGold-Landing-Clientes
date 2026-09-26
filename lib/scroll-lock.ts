"use client";

// Único dueño del scroll de la página.
//
// Cinco componentes necesitan bloquearlo (menú de celular, carrito, aviso de
// medios de pago, pedido mayorista y ficha ampliada del mayorista) y antes cada
// uno escribía directo en `document.body.style.overflow`. Eso daba dos fallos:
//
//   1. Cerrar uno desbloqueaba la página aunque otro siguiera abierto.
//   2. Un panel que dejaba de dibujarse sin desmontarse —el pedido mayorista al
//      quedarse sin piezas— nunca ejecutaba su limpieza y la página se quedaba
//      sin scroll para siempre.
//
// Con un contador, el scroll vuelve solo cuando el ÚLTIMO interesado lo suelta.
let locks = 0;

/**
 * Bloquea el scroll y devuelve la función que lo libera. Pensada para usarse
 * como limpieza de un efecto:
 *
 *   useEffect(() => {
 *     if (!abierto) return;
 *     return lockScroll();
 *   }, [abierto]);
 */
export function lockScroll(): () => void {
  locks += 1;
  document.body.style.overflow = "hidden";

  let released = false;
  return () => {
    // Idempotente: si React llama la limpieza dos veces (StrictMode en
    // desarrollo) no debe descontar dos veces y desbloquear de más.
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) document.body.style.overflow = "";
  };
}

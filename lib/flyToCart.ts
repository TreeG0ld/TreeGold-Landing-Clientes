// Dispara la animación "volar al carrito" desde unas coordenadas de pantalla.
export function flyToCart(x: number, y: number, image: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("fly-to-cart", { detail: { x, y, image } })
  );
}

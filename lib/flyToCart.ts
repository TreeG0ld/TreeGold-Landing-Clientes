import imageLoader from "@/lib/imageLoader";

// Dispara la animación "volar al carrito" desde unas coordenadas de pantalla.
//
// `from` es la foto del producto que el cliente está viendo. La burbuja usa
// exactamente el archivo que esa foto ya descargó (`currentSrc`), así que
// aparece al instante. Antes usaba la URL original de Cloudinary: el archivo
// crudo, a veces de varios MB, que casi nunca terminaba de bajar en los 0,85 s
// del vuelo (la burbuja llegaba vacía) y que además venía SIN el recorte del
// catálogo, con la franja de código y precio de costo del proveedor.
export function flyToCart(
  x: number,
  y: number,
  image: string,
  from?: HTMLImageElement | null
) {
  if (typeof window === "undefined") return;
  const src =
    from?.complete && from.currentSrc
      ? from.currentSrc
      : // Sin foto en pantalla (o aún cargando): una miniatura optimizada y
        // recortada, que pesa unos pocos KB.
        imageLoader({ src: image, width: 128 });
  window.dispatchEvent(
    new CustomEvent("fly-to-cart", { detail: { x, y, image: src } })
  );
}

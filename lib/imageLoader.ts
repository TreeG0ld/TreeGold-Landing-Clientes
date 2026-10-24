// Loader personalizado para next/image (images.loader: "custom" en
// next.config.mjs). Se aplica a TODOS los <Image> del sitio.
//
// Genera, a partir de la URL guardada en cada producto, una versión optimizada
// al ancho exacto que el navegador necesita: el catálogo carga miniaturas
// ligeras y la página de producto alta resolución, todo desde el mismo archivo
// original y sin servir nunca el original pesado.
//
// Las fotos viven en ImageKit desde octubre de 2026 (antes en Cloudinary, que
// se dejó por la cuota del plan gratis; ver CLAUDE.md). Las fotos del catálogo
// del proveedor se migraron ya sin la franja de código y precio de costo que
// traían impresa abajo, así que aquí no se recorta nada.

type LoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  // --- ImageKit: WebP al ancho pedido; c-at_max nunca agranda más que el
  // original. Cada ancho distinto es una versión más que ImageKit genera y
  // guarda: no agregar anchos en next.config.mjs sin motivo. ---
  if (src.includes("ik.imagekit.io")) {
    const url = new URL(src);
    url.searchParams.set("tr", `w-${width},f-webp,q-${quality ?? 80},c-at_max`);
    return url.toString();
  }

  // --- Unsplash (imágenes de ejemplo) ---
  if (src.includes("images.unsplash.com")) {
    // Tope de 1600px: una imagen de fondo nunca necesita más ancho que eso,
    // aunque el navegador pida más por el pixel ratio de pantallas 4K/Retina.
    const cappedWidth = Math.min(width, 1600);
    const url = new URL(src);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(cappedWidth));
    url.searchParams.set("q", String(quality ?? 68));
    return url.toString();
  }

  // --- Cualquier otra (locales en /public, etc.): se deja igual ---
  return src;
}

// Loader personalizado para next/image.
//
// Genera, a partir de la URL guardada en cada producto, una versión
// optimizada al ancho exacto que el navegador necesita. Así nunca se
// sirve la imagen original pesada: el catálogo carga miniaturas ligeras
// y la página de producto carga alta resolución, todo desde el mismo
// archivo original sin perder calidad.
//
// Se aplica automáticamente a TODOS los <Image> del sitio, sin tener
// que tocar cada componente.

type LoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

export default function imageLoader({ src, width }: LoaderArgs): string {
  // --- Cloudinary (almacenamiento definitivo de las fotos) ---
  // Limpieza de la foto de catálogo (el original no se toca):
  //   1) c_crop,g_north,h_0.85 -> quita el 15% inferior, donde el catálogo
  //      imprime el código y los precios (así el cliente nunca ve el costo).
  //   2) e_trim -> elimina el marco gris / espacio sobrante alrededor.
  //   3) c_pad,ar_1:1,b_white -> deja la imagen cuadrada con fondo blanco
  //      uniforme; el producto queda completo y centrado, sin distorsión.
  //   4) optimización de entrega:
  //      f_auto      -> mejor formato para el navegador (WebP / AVIF)
  //      q_auto:good -> calidad inteligente: pesa poco sin perder detalle
  //      w_<width>   -> ancho que pide el navegador según el "sizes"
  //      c_limit     -> nunca agranda más allá del original (cuida la calidad)
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    const transforms = `c_crop,g_north,h_0.85/e_trim/c_pad,ar_1:1,b_white/f_auto,q_auto:good,w_${width},c_limit`;
    return src.replace("/upload/", `/upload/${transforms}/`);
  }

  // --- Unsplash (imágenes de ejemplo mientras subes las reales) ---
  if (src.includes("images.unsplash.com")) {
    const url = new URL(src);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", "80");
    return url.toString();
  }

  // --- Cualquier otra (locales en /public, etc.): se deja igual ---
  return src;
}

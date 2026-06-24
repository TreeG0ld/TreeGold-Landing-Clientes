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
  // Inserta las transformaciones justo después de "/upload/":
  //   f_auto      -> mejor formato para el navegador (WebP / AVIF)
  //   q_auto:good -> calidad inteligente: pesa poco sin perder detalle
  //   w_<width>   -> ancho que pide el navegador según el "sizes"
  //   c_limit     -> nunca agranda más allá del original (cuida la calidad)
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    const transforms = `f_auto,q_auto:good,w_${width},c_limit`;
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

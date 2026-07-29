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

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  // --- Cloudinary (almacenamiento definitivo de las fotos) ---
  // Limpieza de la foto de catálogo (el original no se toca):
  //   1) c_crop,g_north,h_0.75 -> quita el 25% inferior, donde el catálogo
  //      imprime el código y los precios (así el cliente nunca ve el costo).
  //      (antes era h_0.85, pero en varias fotos la franja de precio empieza
  //      ~81% hacia abajo y quedaba parcialmente visible; 0.75 deja margen).
  //   2) e_trim -> elimina el marco gris / espacio sobrante alrededor.
  //   3) c_pad,ar_1:1,b_white -> deja la imagen cuadrada con fondo blanco
  //      uniforme; el producto queda completo y centrado, sin distorsión.
  //   4) optimización de entrega:
  //      f_auto      -> mejor formato para el navegador (WebP / AVIF)
  //      q_auto:good -> calidad inteligente: pesa poco sin perder detalle
  //      w_<width>   -> ancho que pide el navegador según el "sizes"
  //      c_limit     -> nunca agranda más allá del original (cuida la calidad)
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    // Fotos que NO necesitan el recorte de catálogo (limpieza de precio):
    //   - treegold/marca/  -> editoriales de marca (modelos, taller, banners).
    //   - treegold/admin/  -> productos subidos desde el panel /admin. Toda
    //     subida nueva pasa por /api/admin/cloudinary-signature, que fija esa
    //     carpeta de forma fija (ver esa ruta) — así que cualquier foto que
    //     caiga ahí es, por definición, una foto nueva ya encuadrada
    //     correctamente. No hace falta marcar nada a mano: es automático.
    //   Todo lo demás (treegold/anillos, treegold/cadenas, ...) es el lote
    //   histórico importado del catálogo del proveedor, que sí trae la franja
    //   de precio y necesita el recorte + cuadrado de siempre.
    if (src.includes("/treegold/marca/") || src.includes("/treegold/admin/")) {
      const transforms = `f_auto,q_auto:good,w_${width},c_limit`;
      return src.replace("/upload/", `/upload/${transforms}/`);
    }
    const transforms = `c_crop,g_north,h_0.75/e_trim/c_pad,ar_1:1,b_white/f_auto,q_auto:good,w_${width},c_limit`;
    return src.replace("/upload/", `/upload/${transforms}/`);
  }

  // --- Unsplash (imágenes de ejemplo mientras subes las reales) ---
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

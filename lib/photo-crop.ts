// Recorte de fotos de producto en el navegador, antes de subirlas a ImageKit
// (lo usa components/admin/PhotoStudio). Todo se hace aquí, en un <canvas>: a
// ImageKit le llega la foto ya recortada y liviana, así que no gasta
// transformaciones ni guarda los PNG de ~1,4 MB que se subían antes.

export type Rect = { x: number; y: number; width: number; height: number };

/**
 * Proporción de las fotos: cuadrada, como las tarjetas de producto y la página
 * del producto (y como el 88% de las fotos que ya había).
 */
export const PHOTO_ASPECT = 1;

/** Alto máximo del archivo final: 2000×2000 sobra para cualquier pantalla. */
export const PHOTO_MAX_HEIGHT = 2000;

/**
 * Tamaño del archivo final para un recorte de `cropHeight` píxeles de la foto
 * original: nunca más grande que el recorte (agrandar solo pierde calidad) ni
 * que PHOTO_MAX_HEIGHT, y siempre en la proporción exacta (PHOTO_ASPECT).
 */
export function outputSize(cropHeight: number): { width: number; height: number } {
  const height = Math.max(1, Math.min(PHOTO_MAX_HEIGHT, Math.round(cropHeight)));
  return { width: Math.max(1, Math.round(height * PHOTO_ASPECT)), height };
}

/**
 * Busca el contenido de la foto ignorando el borde de color parejo que la
 * rodea (los márgenes blancos de las fotos de catálogo). `data` son los píxeles
 * RGBA de la foto, normalmente reducida a unos cientos de píxeles para que sea
 * rápido. El color de fondo es el promedio de las cuatro esquinas; un píxel es
 * "contenido" si se aleja de ese color más que `tolerance` (0–441).
 *
 * Devuelve null si no encuentra contenido o si el contenido ocupa casi toda la
 * foto (no hay bordes que quitar).
 */
export function detectContentBox(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  tolerance = 38
): Rect | null {
  const at = (x: number, y: number) => (y * width + x) * 4;
  const corners = [at(0, 0), at(width - 1, 0), at(0, height - 1), at(width - 1, height - 1)];
  const bg = [0, 1, 2].map((c) => corners.reduce((sum, i) => sum + data[i + c], 0) / 4);

  // Si las esquinas no se parecen entre sí, la foto no tiene un borde parejo
  // (es una foto con escenario): no hay nada que recortar.
  const cornerSpread = Math.max(
    ...corners.map((i) => Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]))
  );
  if (cornerSpread > tolerance) return null;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = at(x, y);
      // Píxeles casi transparentes cuentan como fondo.
      if (data[i + 3] < 16) continue;
      const d = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
      if (d > tolerance) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;

  const box = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  if (box.width * box.height > 0.94 * width * height) return null;
  return box;
}

/**
 * El recorte (en PHOTO_ASPECT) que encuadra `box` (en píxeles de la foto) con un margen
 * alrededor, centrado en el contenido. Nunca corta el contenido: si no cabe
 * dentro de la foto en esa proporción, el recorte se sale de ella por ese lado, centrado,
 * y ese espacio se rellena con la foto difuminada (ver drawCrop). Por el lado
 * en que sí cabe, el recorte se mantiene dentro de la foto.
 */
export function fitAspectRect(
  box: Rect,
  imageWidth: number,
  imageHeight: number,
  aspect = PHOTO_ASPECT,
  margin = 0.08
): Rect {
  let w = box.width * (1 + 2 * margin);
  let h = box.height * (1 + 2 * margin);
  if (w / h > aspect) h = w / aspect;
  else w = h * aspect;

  const place = (center: number, size: number, limit: number) =>
    size >= limit ? (limit - size) / 2 : Math.min(Math.max(center - size / 2, 0), limit - size);
  return {
    x: place(box.x + box.width / 2, w, imageWidth),
    y: place(box.y + box.height / 2, h, imageHeight),
    width: w,
    height: h,
  };
}

/** El recorte que muestra la foto completa, centrada. */
export function fullPhotoArea(imageWidth: number, imageHeight: number): Rect {
  return fitAspectRect({ x: 0, y: 0, width: imageWidth, height: imageHeight }, imageWidth, imageHeight, PHOTO_ASPECT, 0);
}

/** Carga una imagen y espera a que esté lista para dibujarse en un canvas. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Las fotos ya subidas vienen de ImageKit, que responde con
    // Access-Control-Allow-Origin: *. Sin esto el canvas quedaría "manchado" y
    // no se podría exportar el recorte.
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo abrir la foto."));
    img.src = src;
  });
}

/**
 * Dibuja en `canvas` el recorte `area` de `img` girada `rotation` grados, al
 * tamaño del canvas. `area` va en píxeles de la foto ya girada (lo que entrega
 * react-easy-crop). Se dibuja directo al tamaño final, sin un canvas intermedio
 * del tamaño de la foto: en celulares un canvas de 12+ megapíxeles girado
 * puede pasarse del límite del navegador.
 */
function drawCrop(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  area: Rect,
  rotation: number
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("El navegador no permite editar imágenes.");
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const rad = (rotation * Math.PI) / 180;
  // Caja que ocupa la foto ya girada: el sistema de coordenadas de `area`.
  const boxW = Math.abs(Math.cos(rad) * w) + Math.abs(Math.sin(rad) * h);
  const boxH = Math.abs(Math.sin(rad) * w) + Math.abs(Math.cos(rad) * h);

  ctx.save();
  // Fondo blanco: los PNG con transparencia no deben quedar negros.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Si el recorte se sale de la foto (foto completa, alejada) o la foto está
  // enderezada, quedan huecos: se rellenan con la misma foto difuminada, que
  // es justo lo que muestra el estudio detrás del marco mientras se edita.
  const leaves =
    area.x < -0.5 || area.y < -0.5 || area.x + area.width > boxW + 0.5 || area.y + area.height > boxH + 0.5;
  if (leaves || rotation % 90 !== 0) drawBlurredBackdrop(ctx, img, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.scale(canvas.width / area.width, canvas.height / area.height);
  ctx.translate(-area.x, -area.y);
  ctx.translate(boxW / 2, boxH / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -w / 2, -h / 2);
  ctx.restore();
}

/**
 * La foto entera cubriendo el lienzo, muy difuminada. Con el filtro blur del
 * canvas donde existe; si no (Safari viejo), reduciéndola a unos pocos
 * píxeles y volviéndola a agrandar, que da un difuminado parecido.
 */
function drawBlurredBackdrop(ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number) {
  const s = Math.max(width / img.naturalWidth, height / img.naturalHeight) * 1.15;
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  const dx = (width - dw) / 2;
  const dy = (height - dh) / 2;

  ctx.save();
  ctx.filter = `blur(${Math.max(8, Math.round(width / 22))}px)`;
  if (ctx.filter.startsWith("blur")) {
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    const k = 16 / width;
    const tiny = document.createElement("canvas");
    tiny.width = 16;
    tiny.height = Math.max(1, Math.round(height * k));
    const t = tiny.getContext("2d");
    if (t) {
      t.drawImage(img, dx * k, dy * k, dw * k, dh * k);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(tiny, 0, 0, width, height);
    }
  }
  ctx.restore();
}

/**
 * Exporta el recorte como archivo listo para subir: WebP de buena calidad, o
 * JPEG en los navegadores que no saben generar WebP.
 */
export async function exportCrop(img: HTMLImageElement, area: Rect, rotation: number): Promise<Blob> {
  const { width, height } = outputSize(area.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  drawCrop(canvas, img, area, rotation);

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("No se pudo preparar la foto.");
  return jpeg;
}

/**
 * Para el "Ajuste automático": el recorte que deja la joya centrada y sin
 * los bordes blancos. Analiza una copia reducida de la foto (rápido aunque la
 * original tenga 12 megapíxeles). Sin bordes que quitar (una foto con
 * escenario), muestra la foto completa: no se sabe dónde está la joya y es
 * mejor no cortar nada.
 */
export function autoCropArea(img: HTMLImageElement): Rect {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const scale = Math.min(1, 320 / Math.max(w, h));
  const sw = Math.max(1, Math.round(w * scale));
  const sh = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return fullPhotoArea(w, h);
  ctx.drawImage(img, 0, 0, sw, sh);

  const box = detectContentBox(ctx.getImageData(0, 0, sw, sh).data, sw, sh);
  if (!box) return fullPhotoArea(w, h);
  return fitAspectRect(
    { x: box.x / scale, y: box.y / scale, width: box.width / scale, height: box.height / scale },
    w,
    h
  );
}

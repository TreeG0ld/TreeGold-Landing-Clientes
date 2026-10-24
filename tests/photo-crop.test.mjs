// Tests UNITARIOS de lib/photo-crop.ts: los cálculos del estudio de fotos del
// panel (tamaño final, detección de bordes y encuadre cuadrado). El dibujo en
// <canvas> no se prueba aquí: necesita un navegador.
import test from "node:test";
import assert from "node:assert/strict";

const { outputSize, detectContentBox, fitAspectRect, fullPhotoArea, PHOTO_ASPECT, PHOTO_MAX_HEIGHT } = await import(
  "../lib/photo-crop.ts"
);

// Foto sintética RGBA: fondo de un color y un rectángulo de otro.
function photo(width, height, bg, rect, fg = [180, 140, 40]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inside = rect && x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
      const [r, g, b] = inside ? fg : bg;
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return data;
}

test("las fotos salen cuadradas, como las tarjetas de la tienda", () => {
  assert.equal(PHOTO_ASPECT, 1);
});

test("tamaño final: cuadrado y nunca más grande que el recorte", () => {
  assert.deepEqual(outputSize(1000), { width: 1000, height: 1000 });
  assert.deepEqual(outputSize(999.6), { width: 1000, height: 1000 });
});

test("tamaño final: tope de 2000 px aunque el recorte sea enorme", () => {
  assert.equal(PHOTO_MAX_HEIGHT, 2000);
  assert.deepEqual(outputSize(5000), { width: 2000, height: 2000 });
});

test("bordes blancos: encuentra la joya dentro del margen", () => {
  const data = photo(100, 80, [255, 255, 255], { x: 30, y: 20, width: 40, height: 30 });
  assert.deepEqual(detectContentBox(data, 100, 80), { x: 30, y: 20, width: 40, height: 30 });
});

test("bordes blancos: tolera un fondo casi blanco (no exactamente #fff)", () => {
  const data = photo(100, 80, [246, 244, 241], { x: 10, y: 10, width: 20, height: 20 });
  assert.deepEqual(detectContentBox(data, 100, 80), { x: 10, y: 10, width: 20, height: 20 });
});

test("bordes blancos: sin borde parejo (foto con escenario) no recorta nada", () => {
  const data = photo(100, 80, [255, 255, 255], { x: 0, y: 0, width: 50, height: 80 }, [40, 40, 40]);
  // Dos esquinas oscuras y dos blancas: no es un margen, es la foto.
  assert.equal(detectContentBox(data, 100, 80), null);
});

test("bordes blancos: si el contenido llena casi toda la foto, no hay nada que quitar", () => {
  const data = photo(100, 100, [255, 255, 255], { x: 1, y: 1, width: 98, height: 98 });
  assert.equal(detectContentBox(data, 100, 100), null);
});

test("encuadre: cuadrado, centrado en la joya y con margen", () => {
  const r = fitAspectRect({ x: 400, y: 300, width: 200, height: 100 }, 1000, 1000);
  assert.ok(Math.abs(r.width - r.height) < 1e-9, "cuadrado");
  assert.ok(r.width >= 200 * 1.16 - 1e-9, "deja margen alrededor");
  assert.ok(Math.abs(r.x + r.width / 2 - 500) < 1e-9, "centrado en x");
  assert.ok(Math.abs(r.y + r.height / 2 - 350) < 1e-9, "centrado en y");
});

test("encuadre: nunca se sale de la foto aunque la joya esté en un borde", () => {
  const r = fitAspectRect({ x: 0, y: 0, width: 100, height: 100 }, 1000, 1000);
  assert.ok(r.x >= 0 && r.y >= 0);
  assert.ok(r.x + r.width <= 1000 + 1e-9 && r.y + r.height <= 1000 + 1e-9);
});

test("encuadre: nunca corta la joya; si no cabe en cuadrado, el recorte se sale de la foto centrado", () => {
  // Joya que ocupa todo el ancho de una foto horizontal 1200×600: en cuadrado
  // hace falta 1200×1200, más alto que la foto (el resto se rellena difuminado).
  const r = fitAspectRect({ x: 0, y: 0, width: 1200, height: 600 }, 1200, 600, PHOTO_ASPECT, 0);
  assert.deepEqual(r, { x: 0, y: -300, width: 1200, height: 1200 });
});

test("foto completa: una foto cuadrada queda tal cual", () => {
  assert.deepEqual(fullPhotoArea(1254, 1254), { x: 0, y: 0, width: 1254, height: 1254 });
});

test("foto completa: una foto vertical se ve entera a lo alto", () => {
  assert.deepEqual(fullPhotoArea(600, 1000), { x: -200, y: 0, width: 1000, height: 1000 });
});

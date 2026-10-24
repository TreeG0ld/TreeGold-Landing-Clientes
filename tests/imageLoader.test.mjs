import test from "node:test";
import assert from "node:assert/strict";
import loader from "../lib/imageLoader.ts";

const CLD =
  "https://res.cloudinary.com/dkab59i18/image/upload/v1782339418/treegold/anillos/09120002.jpg";

test("Cloudinary: encadena recorte de precio + e_trim + cuadrado blanco + optimización", () => {
  const url = loader({ src: CLD, width: 400 });
  assert.match(
    url,
    /\/upload\/c_crop,g_north,h_0\.75\/e_trim\/c_pad,ar_1:1,b_white\/f_webp,fl_awebp,q_auto:good,w_400,c_limit\//
  );
});

test("Cloudinary: oculta el precio (recorte del 25% inferior)", () => {
  const url = loader({ src: CLD, width: 600 });
  assert.ok(url.includes("c_crop,g_north,h_0.75"), "debe recortar la franja del precio");
});

test("Rendimiento: WebP fijo (no f_auto, que guarda una copia por formato) y q_auto", () => {
  const url = loader({ src: CLD, width: 800 });
  assert.ok(url.includes("f_webp,fl_awebp"), "WebP para todos los navegadores");
  assert.ok(!url.includes("f_auto"), "f_auto multiplica las copias en Cloudinary");
  assert.ok(url.includes("q_auto:good"), "q_auto para peso óptimo");
});

test("Rendimiento: nunca agranda más allá del original (c_limit)", () => {
  const url = loader({ src: CLD, width: 4000 });
  assert.ok(url.includes("c_limit"), "c_limit evita upscaling");
});

test("Responsive: el ancho pedido se refleja en la URL", () => {
  assert.ok(loader({ src: CLD, width: 256 }).includes("w_256"));
  assert.ok(loader({ src: CLD, width: 1080 }).includes("w_1080"));
});

test("Responsive: anchos distintos producen URLs distintas", () => {
  const a = loader({ src: CLD, width: 256 });
  const b = loader({ src: CLD, width: 1080 });
  assert.notEqual(a, b);
});

test("Cloudinary: la transformación se inserta una sola vez tras /upload/", () => {
  const url = loader({ src: CLD, width: 400 });
  assert.equal(url.split("/upload/").length, 2, "no debe duplicar /upload/");
});

test("Unsplash: aplica auto=format y el ancho/calidad pedidos", () => {
  const src =
    "https://images.unsplash.com/photo-123?auto=format&fit=crop&w=1200&q=80";
  const url = loader({ src, width: 640 });
  const u = new URL(url);
  assert.equal(u.searchParams.get("auto"), "format");
  assert.equal(u.searchParams.get("w"), "640");
  assert.ok(u.searchParams.get("q"));
});

test("Local/otros orígenes: la URL se devuelve sin cambios", () => {
  assert.equal(loader({ src: "/logo.png", width: 100 }), "/logo.png");
  assert.equal(loader({ src: "/favicon.ico", width: 32 }), "/favicon.ico");
});

test("Cloudinary sin /upload/ no se transforma (caso límite)", () => {
  const weird = "https://res.cloudinary.com/dkab59i18/raw/v1/x.jpg";
  assert.equal(loader({ src: weird, width: 400 }), weird);
});

test("Fotos nuevas (treegold/admin/): sin recorte de precio ni zoom, solo optimización", () => {
  const NEW =
    "https://res.cloudinary.com/dkab59i18/image/upload/v1784000000/treegold/admin/abc123.jpg";
  const url = loader({ src: NEW, width: 400 });
  assert.ok(!url.includes("c_crop"), "no debe recortar");
  assert.ok(!url.includes("e_trim"), "no debe recortar el marco");
  assert.ok(!url.includes("c_pad"), "no debe forzar cuadrado");
  assert.equal(url, NEW.replace("/upload/", "/upload/f_webp,fl_awebp,q_auto:good,w_400,c_limit/"));
});

test("Fotos antiguas (cualquier otra carpeta de treegold/): mantienen el recorte de siempre", () => {
  for (const folder of ["anillos", "cadenas", "rosarios", "cualquier-cosa-nueva"]) {
    const url = loader({
      src: `https://res.cloudinary.com/dkab59i18/image/upload/v1/treegold/${folder}/x.jpg`,
      width: 400,
    });
    assert.ok(url.includes("c_crop,g_north,h_0.75"), `${folder} debe seguir recortando`);
  }
});

// Cloudinary guarda una copia por cada texto de transformación distinto. Estas
// URLs tienen que seguir siendo idénticas a las de las copias ya generadas:
// si una prueba de estas falla, el cambio obligaría a rehacer TODAS las copias
// de todas las fotos (y eso se paga en cuota). Cambiarlas solo a propósito.
test("Cuota de Cloudinary: las URLs coinciden con las copias ya generadas", () => {
  const ADMIN =
    "https://res.cloudinary.com/dkab59i18/image/upload/v1/treegold/admin/abc.png";
  assert.equal(
    loader({ src: ADMIN, width: 640 }),
    "https://res.cloudinary.com/dkab59i18/image/upload/f_webp,fl_awebp,q_auto:good,w_640,c_limit/v1/treegold/admin/abc.png"
  );
});

test("ImageKit: optimización de catálogo estándar (WebP, ancho, calidad, c-at_max)", () => {
  const IK = "https://ik.imagekit.io/jmbbfxnqu/treegold/pulseras/09120001.jpg";
  const url = loader({ src: IK, width: 400 });
  assert.equal(url, `${IK}?tr=w-400%2Cf-webp%2Cq-80%2Cc-at_max`);
});

test("ImageKit: responsive - anchos pedidos se reflejan en el parámetro tr", () => {
  const IK = "https://ik.imagekit.io/jmbbfxnqu/treegold/pulseras/09120001.jpg";
  assert.ok(loader({ src: IK, width: 256 }).includes("w-256"));
  assert.ok(loader({ src: IK, width: 1200 }).includes("w-1200"));
});

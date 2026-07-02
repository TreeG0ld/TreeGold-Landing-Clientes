import test from "node:test";
import assert from "node:assert/strict";
import loader from "../lib/imageLoader.ts";

const CLD =
  "https://res.cloudinary.com/dkab59i18/image/upload/v1782339418/treegold/anillos/09120002.jpg";

test("Cloudinary: encadena recorte de precio + e_trim + cuadrado blanco + optimización", () => {
  const url = loader({ src: CLD, width: 400 });
  assert.match(
    url,
    /\/upload\/c_crop,g_north,h_0\.75\/e_trim\/c_pad,ar_1:1,b_white\/f_auto,q_auto:good,w_400,c_limit\//
  );
});

test("Cloudinary: oculta el precio (recorte del 25% inferior)", () => {
  const url = loader({ src: CLD, width: 600 });
  assert.ok(url.includes("c_crop,g_north,h_0.75"), "debe recortar la franja del precio");
});

test("Rendimiento: siempre formato y calidad automáticos (WebP/AVIF, q_auto)", () => {
  const url = loader({ src: CLD, width: 800 });
  assert.ok(url.includes("f_auto"), "f_auto para servir WebP/AVIF");
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

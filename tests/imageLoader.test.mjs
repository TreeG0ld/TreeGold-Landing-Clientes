import test from "node:test";
import assert from "node:assert/strict";
import loader from "../lib/imageLoader.ts";

const IK = "https://ik.imagekit.io/jmbbfxnqu/treegold/pulseras/09120001.jpg";

// ImageKit guarda una versión por cada texto de transformación distinto: si
// esta prueba falla, el cambio haría que regenere todas las versiones.
test("ImageKit: WebP al ancho pedido, calidad 80, sin agrandar (c-at_max)", () => {
  assert.equal(loader({ src: IK, width: 400 }), `${IK}?tr=w-400%2Cf-webp%2Cq-80%2Cc-at_max`);
});

test("ImageKit: el ancho pedido se refleja en la URL", () => {
  assert.ok(loader({ src: IK, width: 256 }).includes("w-256"));
  assert.ok(loader({ src: IK, width: 1200 }).includes("w-1200"));
});

test("ImageKit: anchos distintos producen URLs distintas", () => {
  assert.notEqual(loader({ src: IK, width: 256 }), loader({ src: IK, width: 1200 }));
});

test("ImageKit: la calidad pedida se respeta", () => {
  assert.ok(loader({ src: IK, width: 400, quality: 60 }).includes("q-60"));
});

test("Unsplash: aplica auto=format y el ancho/calidad pedidos", () => {
  const src = "https://images.unsplash.com/photo-123?auto=format&fit=crop&w=1200&q=80";
  const u = new URL(loader({ src, width: 640 }));
  assert.equal(u.searchParams.get("auto"), "format");
  assert.equal(u.searchParams.get("w"), "640");
  assert.ok(u.searchParams.get("q"));
});

test("Local/otros orígenes: la URL se devuelve sin cambios", () => {
  assert.equal(loader({ src: "/logo.png", width: 100 }), "/logo.png");
  assert.equal(loader({ src: "/favicon.ico", width: 32 }), "/favicon.ico");
  const old = "https://res.cloudinary.com/x/image/upload/v1/a.jpg";
  assert.equal(loader({ src: old, width: 400 }), old);
});

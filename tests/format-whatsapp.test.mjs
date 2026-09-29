// Tests UNITARIOS de edge cases generales: formato de precios (formatCOP)
// y construcción de los mensajes de WhatsApp (el "checkout" real del sitio).
import test from "node:test";
import assert from "node:assert/strict";

const { formatCOP } = await import("../lib/format.ts");
const {
  buildProductLink,
  buildSelectionLink,
  buildWholesaleSelectionLink,
  buildGeneralLink,
} = await import("../lib/whatsapp.ts");
const { site } = await import("../lib/site.ts");

// --- formatCOP ---

test("unitario: formatCOP formatea COP sin decimales", () => {
  const s = formatCOP(1200000);
  assert.ok(s.includes("1.200.000"), s);
  assert.ok(!s.includes(","), "sin decimales");
});

test("unitario: formatCOP redondea precios con muchos decimales", () => {
  assert.equal(formatCOP(99999.999), formatCOP(100000));
  assert.equal(formatCOP(0.4), formatCOP(0));
});

test("unitario: formatCOP con 0 y negativos no lanza", () => {
  assert.ok(formatCOP(0).includes("0"));
  assert.ok(formatCOP(-5000).includes("5.000"));
});

// --- enlaces de WhatsApp ---

function decodeMessage(link) {
  const url = new URL(link);
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, `/${site.whatsapp}`);
  return url.searchParams.get("text");
}

test("unitario: buildProductLink apunta al número del negocio y lleva nombre y precio", () => {
  const msg = decodeMessage(buildProductLink("Anillo Aurora", 4200000));
  assert.ok(msg.includes("Anillo Aurora"));
  assert.ok(msg.includes("4.200.000"));
});

test("unitario: unicode y emojis en el nombre del producto sobreviven el encode/decode", () => {
  const name = "Anillo Ñandú 💍 «edición» 18k";
  const link = buildProductLink(name, 100000);
  assert.ok(!link.includes("💍"), "el emoji debe ir percent-encoded en la URL");
  assert.ok(decodeMessage(link).includes(name), "y decodificarse intacto");
});

test("unitario: buildSelectionLink lista items con referencia, talla, cantidad y subtotal", () => {
  const items = [
    { slug: "B-45011", name: "Cadena Roma", price: 100000, image: "", qty: 2 },
    { slug: "AT039", name: "Topo Sol", price: 50000, image: "", size: "7", qty: 1 },
  ];
  const msg = decodeMessage(buildSelectionLink(items, 250000));
  assert.ok(msg.includes("*1. Cadena Roma*"), "nombre numerado y en negrita");
  assert.ok(msg.includes("Ref: B-45011"), "la referencia para ubicar la pieza");
  assert.ok(msg.includes("Ref: AT039"));
  assert.ok(msg.includes("2 × "), "cantidad");
  assert.ok(msg.includes("200.000"), "subtotal = precio * qty");
  assert.ok(msg.includes("Talla: 7"));
  assert.ok(msg.includes("250.000"), "total estimado");
  assert.ok(msg.includes("3 piezas"), "suma de unidades, no de líneas");
});

test("unitario: buildWholesaleSelectionLink lleva referencia y total, sin nombrar la marca", () => {
  const items = [
    { slug: "BAL-4MM", name: "Balín Diamantado 18K 4mm", price: 2700, image: "", qty: 12 },
    { slug: "HER-COR", name: "Herraje Corazón", price: 28000, image: "", qty: 1 },
  ];
  const msg = decodeMessage(buildWholesaleSelectionLink(items, 60400));
  assert.ok(msg.includes("Ref: BAL-4MM"));
  assert.ok(msg.includes("Ref: HER-COR"));
  assert.ok(msg.includes("12 × "));
  assert.ok(msg.includes("32.400"), "subtotal = 12 * 2.700");
  assert.ok(msg.includes("60.400"), "total");
  assert.ok(msg.includes("13 piezas"));
  assert.ok(!msg.includes(site.fullName), "el catálogo mayorista no lleva marca");
});

test("unitario: una sola pieza se nombra en singular", () => {
  const items = [{ slug: "x", name: "Dije", price: 1000, image: "", qty: 1 }];
  assert.ok(decodeMessage(buildSelectionLink(items, 1000)).includes("(1 pieza)"));
});

test("unitario: buildProductLink incluye la referencia cuando se pasa", () => {
  const msg = decodeMessage(buildProductLink("Anillo Aurora", 4200000, "AT039"));
  assert.ok(msg.includes("Ref: AT039"));
});

test("unitario: selección vacía genera un enlace válido (sin items)", () => {
  const msg = decodeMessage(buildSelectionLink([], 0));
  assert.ok(msg.includes("Total estimado"));
});

test("unitario: buildGeneralLink usa el texto por defecto o el provisto", () => {
  assert.ok(decodeMessage(buildGeneralLink()).includes("información"));
  assert.equal(decodeMessage(buildGeneralLink("Hola ¿tienen tallas?")), "Hola ¿tienen tallas?");
});

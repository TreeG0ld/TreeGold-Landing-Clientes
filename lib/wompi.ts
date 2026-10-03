// Integración con Wompi (pasarela de pagos de Bancolombia), sin SDK: solo son
// dos hashes SHA-256 y una URL. Todo aquí corre en el SERVIDOR — el secreto de
// integridad y el de eventos nunca deben llegar al navegador.
//
// Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/
//       https://docs.wompi.co/docs/colombia/eventos/
import { createHash, timingSafeEqual } from "node:crypto";

// Web Checkout por redirección (no el widget en iframe): la CSP del sitio
// bloquea iframes (frame-src 'none') y formularios hacia otros dominios
// (form-action 'self'), y una navegación normal no pasa por ninguna de las dos.
export const WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/p/";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

// Firma de integridad del checkout: SHA-256 de
// "<referencia><montoEnCentavos><moneda>[<fechaExpiración>]<secreto>".
// Wompi rechaza el pago si alguno de esos valores no coincide con la firma,
// que es lo que impide que alguien cambie el monto en la URL.
export function integritySignature(
  p: { reference: string; amountInCents: number; currency: string; expirationTime?: string },
  secret: string
): string {
  return sha256Hex(
    `${p.reference}${p.amountInCents}${p.currency}${p.expirationTime ?? ""}${secret}`
  );
}

export type CheckoutUrlParams = {
  publicKey: string;
  reference: string;
  amountInCents: number;
  currency: string;
  signature: string;
  redirectUrl: string;
  expirationTime?: string;
  customer: { email: string; fullName: string; phone: string };
  shipping: {
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    region: string;
    phone: string;
    name: string;
  };
};

// Arma la URL de Web Checkout. Es lo mismo que enviaría el formulario GET de
// la documentación: URLSearchParams codifica igual que el navegador (incluido
// el ":" de "signature:integrity").
export function buildCheckoutUrl(p: CheckoutUrlParams): string {
  const q = new URLSearchParams({
    "public-key": p.publicKey,
    currency: p.currency,
    "amount-in-cents": String(p.amountInCents),
    reference: p.reference,
    "signature:integrity": p.signature,
    "redirect-url": p.redirectUrl,
    "customer-data:email": p.customer.email,
    "customer-data:full-name": p.customer.fullName,
    "customer-data:phone-number": p.customer.phone,
    "shipping-address:address-line-1": p.shipping.addressLine1,
    "shipping-address:country": "CO",
    "shipping-address:city": p.shipping.city,
    "shipping-address:region": p.shipping.region,
    "shipping-address:phone-number": p.shipping.phone,
    "shipping-address:name": p.shipping.name,
  });
  if (p.expirationTime) q.set("expiration-time", p.expirationTime);
  // Wompi rechaza el pago si este campo tiene menos de 4 caracteres ("El
  // tamaño no puede ser menor que 4"), y aquí llegan las indicaciones del
  // cliente, que pueden ser cortas ("302"). Si no alcanza, se omite: las
  // indicaciones igual quedan guardadas en el pedido (Order.shippingNotes),
  // que es de donde se leen para despachar.
  const linea2 = p.shipping.addressLine2?.trim();
  if (linea2 && linea2.length >= 4) q.set("shipping-address:address-line-2", linea2);
  return `${WOMPI_CHECKOUT_URL}?${q.toString()}`;
}

// Lo que usamos del evento transaction.updated. Wompi manda más campos; se
// guardan completos en PaymentEvent.payload.
export type WompiTransaction = {
  id: string;
  reference: string;
  status: string; // APPROVED | DECLINED | VOIDED | ERROR | PENDING
  amount_in_cents: number;
  currency: string;
  payment_method_type?: string;
};

export type WompiEvent = {
  event: string;
  data: { transaction: WompiTransaction };
  environment: string; // "test" | "prod"
  signature: { properties: string[]; checksum: string };
  timestamp: number;
};

// Lee "transaction.amount_in_cents" dentro de event.data.
function readPath(root: unknown, path: string): unknown {
  let cur: unknown = root;
  for (const key of path.split(".")) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

// Verifica que el evento lo firmó Wompi con NUESTRO secreto de eventos:
// SHA-256 de los valores listados en signature.properties (en ese orden), más
// el timestamp, más el secreto. Sin esto cualquiera podría mandar un
// "APPROVED" falso al webhook y llevarse joyas sin pagar.
export function verifyEventChecksum(event: unknown, secret: string): event is WompiEvent {
  if (!secret || typeof event !== "object" || event === null) return false;
  const e = event as Record<string, unknown>;
  const sig = e.signature as Record<string, unknown> | undefined;
  const props = sig?.properties;
  const checksum = sig?.checksum;
  if (!Array.isArray(props) || props.length === 0 || typeof checksum !== "string") return false;
  if (typeof e.timestamp !== "number" || !Number.isFinite(e.timestamp)) return false;

  let concatenated = "";
  for (const prop of props) {
    if (typeof prop !== "string") return false;
    const value = readPath(e.data, prop);
    // Un campo firmado que no viene es un evento mal formado o manipulado.
    if (typeof value !== "string" && typeof value !== "number") return false;
    concatenated += String(value);
  }
  concatenated += String(e.timestamp) + secret;

  // Wompi manda el hash en mayúsculas; se compara sin distinguir, en tiempo
  // constante.
  const expected = Buffer.from(sha256Hex(concatenated), "utf8");
  const received = Buffer.from(checksum.toLowerCase(), "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

// Las llaves de Wompi llevan el ambiente en el prefijo (pub_test_ / pub_prod_).
// Con esto un evento de pruebas no puede marcar como pagado un pedido de la
// tienda real aunque alguien mezcle los secretos en el .env.
export function expectedEnvironment(publicKey: string): "test" | "prod" {
  return publicKey.startsWith("pub_prod_") ? "prod" : "test";
}

// Id de transacción de Wompi, p. ej. "12210070-1790996245-96217". Llega en la
// URL de regreso (?id=), que cualquiera puede escribir: se valida el formato
// antes de usarlo para armar una URL.
export const WOMPI_TX_ID_RE = /^\d{1,20}-\d{1,20}-\d{1,20}$/;

// Consulta una transacción en la API pública de Wompi (no necesita la llave
// privada). Se usa como respaldo del webhook: si el aviso no llega, el pedido
// igual se puede confirmar con lo que Wompi dice, no con lo que trae la URL.
// El ambiente lo decide nuestra llave pública: con llaves de pruebas solo se
// consulta el sandbox, así un pago de pruebas nunca confirma un pedido real.
// Devuelve null ante cualquier problema (id raro, red, respuesta inesperada).
export async function fetchWompiTransaction(
  id: string,
  publicKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<WompiTransaction | null> {
  if (!WOMPI_TX_ID_RE.test(id)) return null;
  const base =
    expectedEnvironment(publicKey) === "prod"
      ? "https://production.wompi.co/v1"
      : "https://sandbox.wompi.co/v1";
  try {
    const res = await fetchImpl(`${base}/transactions/${id}`, {
      cache: "no-store",
      // La página del pedido espera esta respuesta: si Wompi tarda, se sigue
      // sin ella (el webhook o la siguiente recarga lo resuelven).
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const tx = ((await res.json()) as { data?: Record<string, unknown> })?.data;
    if (
      typeof tx?.id !== "string" ||
      typeof tx.reference !== "string" ||
      typeof tx.status !== "string" ||
      typeof tx.amount_in_cents !== "number" ||
      typeof tx.currency !== "string"
    ) {
      return null;
    }
    return {
      id: tx.id,
      reference: tx.reference,
      status: tx.status,
      amount_in_cents: tx.amount_in_cents,
      currency: tx.currency,
      payment_method_type:
        typeof tx.payment_method_type === "string" ? tx.payment_method_type : undefined,
    };
  } catch {
    return null;
  }
}

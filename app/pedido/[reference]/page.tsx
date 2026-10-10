import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { formatCOP } from "@/lib/format";
import { ORDER_REFERENCE_RE, reconcileWithWompi, type OrderItemSnapshot } from "@/lib/orders";
import OrderStatusWatcher from "@/components/OrderStatusWatcher";

// Cada visita lee el estado actual: el webhook puede cambiarlo en cualquier
// momento.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tu pedido",
  robots: { index: false, follow: false },
};

// La referencia es la única llave de esta página (no pide sesión, porque se
// puede comprar sin cuenta). Por eso se muestra lo justo: nada de dirección
// completa ni teléfono, y el correo a medias.
function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  // Wompi agrega ?id=<transacción> a la URL de regreso.
  searchParams: Promise<{ id?: string }>;
}) {
  const { reference } = await params;
  if (!ORDER_REFERENCE_RE.test(reference)) notFound();
  const { id: transactionId } = await searchParams;

  const readOrder = () => prisma.order.findUnique({
    where: { reference },
    select: {
      reference: true,
      status: true,
      items: true,
      subtotal: true,
      shippingCost: true,
      totalAmount: true,
      customerEmail: true,
      shippingCity: true,
      shippingDepartment: true,
      stockShortage: true,
      createdAt: true,
    },
  });
  let order = await readOrder();
  if (!order) notFound();

  // Respaldo del webhook: si todavía no figura pagado y volvemos de Wompi con
  // un id de transacción, se le pregunta a Wompi (ver reconcileWithWompi). Un
  // fallo aquí no rompe la página: se muestra el estado que haya.
  if (order.status !== "PAID" && typeof transactionId === "string") {
    const changed = await reconcileWithWompi(reference, transactionId).catch((err) => {
      console.error(`[wompi] consulta de respaldo falló para ${reference}:`, err);
      return null;
    });
    if (changed) order = (await readOrder()) ?? order;
  }

  const items = order.items as OrderItemSnapshot[];
  // El enlace de pago de /api/checkout dura 1 hora; pasado ese tiempo sin
  // pago, ya no tiene sentido seguir esperando.
  const expired =
    order.status === "PENDING" && Date.now() - order.createdAt.getTime() > 70 * 60 * 1000;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
      <OrderStatusWatcher status={expired ? "EXPIRED" : order.status} />

      <header className="mb-10 text-center">
        {order.status === "PAID" ? (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-accent" />
            <h1 className="text-4xl md:text-5xl">¡Pago confirmado!</h1>
            <p className="mx-auto mt-4 max-w-md text-secondary">
              Gracias por tu compra. Te escribiremos para coordinar el envío a{" "}
              {order.shippingCity}, {order.shippingDepartment}. El pedido quedó registrado con
              el correo {maskEmail(order.customerEmail)}; guarda esta página para consultarlo.{" "}
              {site.deliveryNote}
            </p>
            {order.stockShortage && (
              <p className="mx-auto mt-4 max-w-md rounded-xl border border-border bg-muted/40 p-4 text-sm text-secondary">
                Una de las piezas se agotó mientras pagabas. Te contactaremos para ofrecerte
                una alternativa o devolverte ese valor.
              </p>
            )}
          </>
        ) : order.status === "PENDING" && !expired ? (
          <>
            <Clock className="mx-auto mb-4 h-12 w-12 animate-pulse text-accent" />
            <h1 className="text-4xl md:text-5xl">Confirmando tu pago…</h1>
            <p className="mx-auto mt-4 max-w-md text-secondary">
              Estamos esperando la confirmación de Wompi. Esta página se actualiza sola; si
              pagaste por PSE puede tardar unos minutos.
            </p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h1 className="text-4xl md:text-5xl">
              {expired ? "El enlace de pago venció" : "El pago no se completó"}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-secondary">
              No se hizo ningún cobro. Tu selección sigue guardada: puedes intentarlo de nuevo
              o escribirnos por WhatsApp.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/seleccion" className="btn-primary">
                Volver a mi selección
              </Link>
              <a
                href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
                  `Hola, tuve un problema pagando el pedido ${order.reference}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                Escribir por WhatsApp
              </a>
            </div>
          </>
        )}
      </header>

      <section className="rounded-2xl border border-border bg-muted/30 p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-2xl">Resumen</h2>
          <span className="text-xs text-secondary/70">Pedido {order.reference}</span>
        </div>
        <ul className="mt-5 divide-y divide-border">
          {items.map((i) => (
            <li key={i.productId} className="flex items-center gap-4 py-4">
              {i.image && (
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image src={i.image} alt={i.name} fill sizes="64px" className="object-cover" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-serif text-lg leading-tight">{i.name}</p>
                <p className="text-sm text-secondary/70">
                  {i.qty} × {formatCOP(i.unitPrice)}
                  {i.size ? ` · ${i.size}` : ""}
                </p>
              </div>
              <span className="font-medium">{formatCOP(i.unitPrice * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-secondary">
            <span>Subtotal</span>
            <span>{formatCOP(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-secondary">
            <span>Envío</span>
            {order.shippingCost === 0 ? (
              <span className="font-medium text-accent">Gratis</span>
            ) : (
              <span>{formatCOP(order.shippingCost)}</span>
            )}
          </div>
          <div className="flex items-baseline justify-between border-t border-border pt-3">
            <span className="font-medium">Total</span>
            <span className="font-serif text-2xl">{formatCOP(order.totalAmount)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

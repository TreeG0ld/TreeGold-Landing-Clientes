import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decideTransition } from "@/lib/order-rules";
import { expectedEnvironment, fetchWompiTransaction, type WompiTransaction } from "@/lib/wompi";

// Copia de cada pieza guardada en Order.items al crear el pedido.
export type OrderItemSnapshot = {
  productId: string;
  slug: string;
  name: string;
  size: string | null;
  image: string | null;
  qty: number;
  unitPrice: number;
};

// "TG-" + 20 caracteres hex (80 bits al azar). Además de identificar el pago
// en Wompi, es la llave de la página /pedido/<referencia>: tiene que ser
// imposible de adivinar para que nadie vea pedidos ajenos.
export function createOrderReference(): string {
  return `TG-${randomBytes(10).toString("hex").toUpperCase()}`;
}

export const ORDER_REFERENCE_RE = /^TG-[0-9A-F]{20}$/;

// Aplica un evento transaction.updated (ya verificado) al pedido. Todo en una
// transacción: registro del evento, cambio de estado y descuento de stock
// quedan juntos o no queda ninguno (y Wompi reintenta).
export async function applyWompiTransaction(
  tx: WompiTransaction,
  environment: string,
  payload: Prisma.InputJsonValue
): Promise<string> {
  return prisma.$transaction(async (db) => {
    const order = await db.order.findUnique({ where: { reference: tx.reference } });

    await db.paymentEvent.create({
      data: {
        orderId: order?.id ?? null,
        reference: tx.reference,
        transactionId: tx.id,
        status: tx.status,
        environment,
        payload,
      },
    });

    if (!order) return "referencia desconocida";

    const decision = decideTransition(order, tx);
    if (decision.action === "ignore") return decision.reason;

    if (decision.action === "close") {
      // updateMany con el estado en el WHERE: si dos avisos llegan a la vez,
      // Postgres serializa la fila y el segundo ya no encuentra PENDING.
      await db.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: {
          status: decision.status,
          wompiTransactionId: tx.id,
          paymentMethod: tx.payment_method_type ?? null,
        },
      });
      return decision.status;
    }

    const claimed = await db.order.updateMany({
      where: { id: order.id, status: { not: "PAID" } },
      data: {
        status: "PAID",
        wompiTransactionId: tx.id,
        paymentMethod: tx.payment_method_type ?? null,
        paidAt: new Date(),
      },
    });
    // Otro aviso del mismo pago ganó la carrera y ya descontó el stock.
    if (claimed.count === 0) return "ya estaba pagado";

    let shortage = false;
    for (const item of order.items as OrderItemSnapshot[]) {
      // Descuento condicionado: nunca deja el stock en negativo.
      const r = await db.product.updateMany({
        where: { id: item.productId, stock: { gte: item.qty } },
        data: { stock: { decrement: item.qty } },
      });
      if (r.count === 0) {
        // No alcanzó (otra persona pagó la última pieza entre la revisión
        // del checkout y este pago): el dinero ya entró, así que el pedido
        // queda pagado y marcado para que el admin lo resuelva.
        shortage = true;
        await db.product.updateMany({ where: { id: item.productId }, data: { stock: 0 } });
      }
    }
    if (shortage) {
      await db.order.update({ where: { id: order.id }, data: { stockShortage: true } });
    }
    return shortage ? "PAID (faltó stock)" : "PAID";
  });
}

// Respaldo del webhook. Cuando el cliente vuelve de Wompi, la URL trae el id
// de la transacción (?id=). No se le cree a la URL: con ese id se le pregunta
// a Wompi y, si la transacción es de ESTE pedido, se aplica igual que un
// aviso (mismas reglas de monto y moneda, misma operación idempotente: si el
// webhook ya lo aplicó, o llega después, el stock no se descuenta dos veces).
// Sin esto, si el aviso no llegaba (Wompi solo reintenta 3 veces en 24 h), un
// pedido pagado se quedaba "pendiente" para siempre.
//
// Devuelve el resultado si cambió algo, o null si no había nada que aplicar.
export async function reconcileWithWompi(
  reference: string,
  transactionId: string
): Promise<string | null> {
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  if (!publicKey) return null;
  const tx = await fetchWompiTransaction(transactionId, publicKey);
  // Id inexistente, de otro pedido o todavía en proceso (PSE puede tardar):
  // no hay nada que hacer; la página se vuelve a consultar sola.
  if (!tx || tx.reference !== reference || tx.status === "PENDING") return null;
  // Si con lo que dice Wompi no cambiaría nada (p. ej. un pedido rechazado
  // que se vuelve a abrir), no se escribe: cada recarga de la página dejaría
  // un registro repetido en PaymentEvent. La decisión se repite dentro de la
  // transacción de applyWompiTransaction, que es la que vale si hay carrera.
  const order = await prisma.order.findUnique({
    where: { reference },
    select: { status: true, amountInCents: true, currency: true },
  });
  if (!order || decideTransition(order, tx).action === "ignore") return null;
  return applyWompiTransaction(tx, expectedEnvironment(publicKey), {
    origen: "consulta a Wompi al volver del pago",
    transaction: tx,
  } as unknown as Prisma.InputJsonValue);
}

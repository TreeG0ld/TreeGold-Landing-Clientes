// Qué hace el webhook con un pedido según el estado que reporta Wompi.
// Separado de lib/orders.ts (que toca la base de datos) para poder probarlo
// sin conexión, igual que lib/wholesale-rules.ts.

export type OrderStatusValue = "PENDING" | "PAID" | "DECLINED" | "VOIDED" | "ERROR";

export type Transition =
  | { action: "pay" }
  | { action: "close"; status: "DECLINED" | "VOIDED" | "ERROR" }
  | { action: "ignore"; reason: string };

export function decideTransition(
  order: { status: OrderStatusValue; amountInCents: number; currency: string },
  tx: { status: string; amount_in_cents: number; currency: string }
): Transition {
  // Un pedido pagado ya descontó stock: nada de lo que llegue después lo
  // mueve (un aviso repetido, o uno viejo que llega tarde).
  if (order.status === "PAID") return { action: "ignore", reason: "ya estaba pagado" };

  if (tx.status === "APPROVED") {
    // El monto firmado es el del pedido; si Wompi reporta otro, algo raro
    // pasó y no se entrega mercancía hasta que alguien lo revise.
    if (tx.amount_in_cents !== order.amountInCents || tx.currency !== order.currency) {
      return { action: "ignore", reason: "el monto o la moneda no coinciden con el pedido" };
    }
    // Se acepta también desde DECLINED/ERROR/VOIDED: si el primer intento
    // fue rechazado y el cliente reintentó con otro medio, el dinero ya entró
    // y el pedido tiene que quedar pagado.
    return { action: "pay" };
  }

  if (tx.status === "DECLINED" || tx.status === "VOIDED" || tx.status === "ERROR") {
    // Solo desde PENDING: un rechazo no pisa otro estado final.
    if (order.status !== "PENDING") return { action: "ignore", reason: "ya estaba cerrado" };
    return { action: "close", status: tx.status };
  }

  return { action: "ignore", reason: `estado ${tx.status} sin efecto` };
}

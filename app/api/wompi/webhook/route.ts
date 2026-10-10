import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { verifyEventChecksum, expectedEnvironment } from "@/lib/wompi";
import { applyWompiTransaction } from "@/lib/orders";

// URL de eventos que se configura en el panel de Wompi:
//   https://treegold.shop/api/wompi/webhook
//
// Wompi reintenta SOLO si no respondemos 200, y como mucho 3 veces en 24 h
// (a los 30 min, 3 h y 24 h). Por eso: 200 para todo lo que ya quedó resuelto
// o que no tiene arreglo reintentando (evento ajeno, referencia desconocida,
// monto que no cuadra), y 5xx solo cuando un reintento sí puede servir (la
// base de datos falló).
export async function POST(req: Request) {
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  if (!eventsSecret || !publicKey) {
    // 503 a propósito: Wompi reintenta y el evento no se pierde si las
    // llaves se corrigen dentro de las próximas horas.
    console.error("[wompi] faltan WOMPI_EVENTS_SECRET / WOMPI_PUBLIC_KEY");
    return NextResponse.json({ error: "No configurado" }, { status: 503 });
  }

  const event: unknown = await req.json().catch(() => null);
  if (!verifyEventChecksum(event, eventsSecret)) {
    console.warn("[wompi] evento con firma inválida, descartado");
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  if (event.event !== "transaction.updated") {
    return NextResponse.json({ ok: true, ignored: event.event });
  }

  if (event.environment !== expectedEnvironment(publicKey)) {
    console.warn(`[wompi] evento de ambiente "${event.environment}" ignorado`);
    return NextResponse.json({ ok: true, ignored: "ambiente" });
  }

  const tx = event.data?.transaction;
  if (
    typeof tx?.id !== "string" ||
    typeof tx.reference !== "string" ||
    typeof tx.status !== "string" ||
    typeof tx.amount_in_cents !== "number" ||
    typeof tx.currency !== "string"
  ) {
    console.warn("[wompi] transacción mal formada en un evento firmado");
    return NextResponse.json({ ok: true, ignored: "mal formado" });
  }

  try {
    const result = await applyWompiTransaction(
      tx,
      event.environment,
      event as unknown as Prisma.InputJsonValue
    );
    console.info(`[wompi] ${tx.reference} ${tx.status} -> ${result}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[wompi] error aplicando ${tx.reference}:`, err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

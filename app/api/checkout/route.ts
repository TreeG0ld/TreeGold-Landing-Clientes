import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, rateLimitIp } from "@/lib/client-ip";
import { validateCheckoutPayload, computeTotals } from "@/lib/checkout";
import { createOrderReference, type OrderItemSnapshot } from "@/lib/orders";
import { integritySignature, buildCheckoutUrl } from "@/lib/wompi";

// Cada llamada crea un pedido PENDING en la base: el límite evita que alguien
// la llene de pedidos basura. Un cliente real no pasa de un par de intentos.
const CHECKOUT_MAX = 10;
const CHECKOUT_WINDOW_MS = 10 * 60 * 1000; // 10 minutos

// El enlace de pago caduca: así nadie paga dentro de una semana un pedido
// armado con el precio y el stock de hoy.
const PAYMENT_WINDOW_MS = 60 * 60 * 1000; // 1 hora

export async function POST(req: Request) {
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  // Sin llaves no hay pago posible: se responde claro en vez de mandar al
  // cliente a una página de Wompi que va a fallar.
  if (!publicKey || !integritySecret) {
    return NextResponse.json(
      { error: "El pago en línea no está disponible en este momento. Escríbenos por WhatsApp." },
      { status: 503 }
    );
  }

  try {
    const ip = clientIp(req);
    if (!ip) {
      return NextResponse.json(
        { error: "No se pudo procesar la petición. Inténtalo de nuevo más tarde." },
        { status: 503 }
      );
    }
    const limit = rateLimit(`checkout:ip:${rateLimitIp(ip)}`, CHECKOUT_MAX, CHECKOUT_WINDOW_MS);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos de pago seguidos. Espera unos minutos y vuelve a intentarlo." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const parsed = validateCheckoutPayload(await req.json().catch(() => null));
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { items, customer } = parsed.data;

    const products = await prisma.product.findMany({
      where: { slug: { in: items.map((i) => i.slug) }, isRetail: true },
      select: { id: true, slug: true, name: true, size: true, images: true, retailPrice: true, stock: true },
    });
    const bySlug = new Map(products.map((p) => [p.slug, p]));

    // Precio y stock salen de la base, no del carrito del navegador.
    const lines: OrderItemSnapshot[] = [];
    const problems: string[] = [];
    for (const item of items) {
      const p = bySlug.get(item.slug);
      if (!p || p.retailPrice <= 0) {
        problems.push(`"${item.slug}" ya no está disponible`);
      } else if (p.stock < item.qty) {
        problems.push(
          p.stock > 0
            ? `de "${p.name}" solo quedan ${p.stock}`
            : `"${p.name}" está agotado`
        );
      } else {
        lines.push({
          productId: p.id,
          slug: p.slug,
          name: p.name,
          size: p.size,
          image: p.images[0] ?? null,
          qty: item.qty,
          unitPrice: p.retailPrice,
        });
      }
    }
    if (problems.length > 0) {
      return NextResponse.json(
        { error: `Revisa tu selección: ${problems.join("; ")}.` },
        { status: 409 }
      );
    }

    const totals = computeTotals(lines, site.shippingCost);

    // Si hay sesión de cliente, el pedido queda en su cuenta. Se confirma que
    // la fila exista porque userId es llave foránea.
    const session = await verifySessionToken((await cookies()).get(AUTH_COOKIE)?.value);
    const user = session
      ? await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } })
      : null;

    const reference = createOrderReference();
    const expirationTime = new Date(Date.now() + PAYMENT_WINDOW_MS).toISOString();

    await prisma.order.create({
      data: {
        reference,
        userId: user?.id ?? null,
        items: lines,
        subtotal: totals.subtotal,
        shippingCost: totals.shippingCost,
        totalAmount: totals.total,
        amountInCents: totals.amountInCents,
        currency: site.currency,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress: customer.address,
        shippingCity: customer.city,
        shippingDepartment: customer.department,
        shippingNotes: customer.notes,
      },
    });

    const signature = integritySignature(
      { reference, amountInCents: totals.amountInCents, currency: site.currency, expirationTime },
      integritySecret
    );

    const url = buildCheckoutUrl({
      publicKey,
      reference,
      amountInCents: totals.amountInCents,
      currency: site.currency,
      signature,
      expirationTime,
      // Wompi le agrega "?id=<transacción>" al volver; la página no lo usa
      // como prueba de pago, solo lee el estado que dejó el webhook.
      redirectUrl: `${site.url}/pedido/${reference}`,
      customer: { email: customer.email, fullName: customer.name, phone: customer.phone },
      shipping: {
        addressLine1: customer.address,
        addressLine2: customer.notes,
        city: customer.city,
        region: customer.department,
        phone: customer.phone,
        name: customer.name,
      },
    });

    return NextResponse.json({ url, reference });
  } catch (err) {
    console.error("[checkout] error creando el pedido:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

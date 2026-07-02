import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { validateProductPayload } from "@/lib/validate-product";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const result = validateProductPayload(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  try {
    const product = await prisma.product.update({ where: { id }, data: result.data });
    return NextResponse.json({ product });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un producto con ese código (slug)." }, { status: 409 });
    }
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }
    if (err.code === "P2003") {
      return NextResponse.json({ error: "La categoría seleccionada no existe." }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo actualizar el producto." }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ error: err.message ?? "Error al eliminar." }, { status: 400 });
  }
}

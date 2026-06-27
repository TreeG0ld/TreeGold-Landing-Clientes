import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

  try {
    const category = await prisma.category.update({ where: { id }, data: { name: name.trim() } });
    return NextResponse.json({ category });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre." }, { status: 409 });
    }
    return NextResponse.json({ error: err.message ?? "Error al actualizar." }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: tiene ${count} producto(s) asociados.` },
      { status: 409 }
    );
  }

  try {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Error al eliminar." }, { status: 400 });
  }
}

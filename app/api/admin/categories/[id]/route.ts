import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { name } = await req.json();
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

  try {
    // Regeneramos el slug junto con el nombre para que la URL de la categoría
    // (/coleccion?categoria=<slug>) siga coincidiendo con su nombre visible.
    const category = await prisma.category.update({
      where: { id },
      data: { name: trimmed, slug: slugify(trimmed) },
    });
    return NextResponse.json({ category });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre." }, { status: 409 });
    }
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
    }
    return NextResponse.json({ error: "No se pudo actualizar la categoría." }, { status: 400 });
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

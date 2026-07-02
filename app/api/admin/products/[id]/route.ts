import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

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
  const body = await req.json();

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        slug: body.slug,
        name: body.name,
        description: body.description ?? "",
        retailPrice: Number(body.retailPrice),
        wholesalePrice: body.wholesalePrice !== "" && body.wholesalePrice != null ? Number(body.wholesalePrice) : null,
        stock: Number(body.stock) || 0,
        material: body.material || null,
        size: body.size || null,
        images: Array.isArray(body.images) ? body.images : [],
        isRetail: Boolean(body.isRetail),
        isWholesale: Boolean(body.isWholesale),
        categoryId: body.categoryId,
      },
    });
    revalidatePath("/");
    revalidatePath("/coleccion");
    revalidatePath(`/producto/${body.slug}`);
    return NextResponse.json({ product });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un producto con ese código (slug)." }, { status: 409 });
    }
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ error: err.message ?? "Error al actualizar." }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/coleccion");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ error: err.message ?? "Error al eliminar." }, { status: 400 });
  }
}

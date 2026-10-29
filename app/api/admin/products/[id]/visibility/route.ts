import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// Ocultar / volver a mostrar un producto desde el listado, sin abrir el
// formulario. Solo toca las dos marcas de tienda (oculto = ni detal ni
// mayorista, igual que la casilla "Ocultar producto" del formulario).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.isRetail !== "boolean" ||
    typeof body.isWholesale !== "boolean"
  ) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: { isRetail: body.isRetail, isWholesale: body.isWholesale },
      select: { id: true, slug: true, isRetail: true, isWholesale: true },
    });
    revalidatePath("/");
    revalidatePath("/coleccion");
    revalidateTag("catalogo");
    revalidatePath(`/producto/${product.slug}`);
    return NextResponse.json({ product });
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ error: "No se pudo actualizar el producto." }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { validateProductPayload } from "@/lib/validate-product";

export async function GET(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const perPage = 30;

  const where = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { slug: { contains: q, mode: "insensitive" as const } }] } : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, totalPages: Math.max(1, Math.ceil(total / perPage)) });
}

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const result = validateProductPayload(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  try {
    const product = await prisma.product.create({ data: result.data });
    revalidatePath("/");
    revalidatePath("/coleccion");
    return NextResponse.json({ product }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un producto con ese código (slug)." }, { status: 409 });
    }
    if (err.code === "P2003") {
      return NextResponse.json({ error: "La categoría seleccionada no existe." }, { status: 400 });
    }
    // No exponemos err.message al cliente (puede filtrar detalles del esquema).
    return NextResponse.json({ error: "No se pudo crear el producto." }, { status: 400 });
  }
}

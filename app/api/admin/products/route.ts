import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

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

  const body = await req.json();

  try {
    const product = await prisma.product.create({
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
    return NextResponse.json({ product }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un producto con ese código (slug)." }, { status: 409 });
    }
    return NextResponse.json({ error: err.message ?? "Error al crear el producto." }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });

  try {
    const category = await prisma.category.create({
      data: { name: name.trim(), slug: slugify(name) },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre." }, { status: 409 });
    }
    return NextResponse.json({ error: err.message ?? "Error al crear la categoría." }, { status: 400 });
  }
}

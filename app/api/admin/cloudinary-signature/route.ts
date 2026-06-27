import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdminApi } from "@/lib/admin-auth";

// Genera una firma para que el navegador suba la imagen DIRECTO a Cloudinary
// (sin pasar por nuestro servidor) usando upload firmado: solo un admin con
// sesión válida puede pedir una firma, así nadie ajeno puede subir archivos
// a la cuenta de Cloudinary del negocio.
export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { folder } = await req.json().catch(() => ({ folder: "treegold/admin" }));
  const safeFolder = typeof folder === "string" && folder.trim() ? folder.trim() : "treegold/admin";

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder: safeFolder };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    timestamp,
    signature,
    folder: safeFolder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  });
}

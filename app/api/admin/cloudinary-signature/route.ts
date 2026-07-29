import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdminApi } from "@/lib/admin-auth";

// Genera una firma para que el navegador suba la imagen DIRECTO a Cloudinary
// (sin pasar por nuestro servidor) usando upload firmado: solo un admin con
// sesión válida puede pedir una firma, así nadie ajeno puede subir archivos
// a la cuenta de Cloudinary del negocio.
// Carpeta y formatos FIJOS en el servidor: no se leen del body. Así, aunque
// una sesión de admin se vea comprometida, la firma solo autoriza subir
// imágenes (no SVG ni ejecutables) a la carpeta del negocio, nunca a una
// carpeta arbitraria de la cuenta de Cloudinary.
// OJO: lib/imageLoader.ts usa esta MISMA carpeta para saber qué fotos son
// "nuevas" (ya vienen bien encuadradas, sin recorte de precio) y cuáles son
// el lote histórico que sí necesita el recorte automático. Si esta carpeta
// cambia, hay que actualizar también imageLoader.ts.
const UPLOAD_FOLDER = "treegold/admin";
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,heic,avif";

export async function POST() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const timestamp = Math.round(Date.now() / 1000);
  // Cloudinary exige firmar TODOS los parámetros que el cliente enviará (menos
  // file/api_key); si el navegador manda un formato/carpeta distinto al firmado,
  // Cloudinary rechaza la subida.
  const paramsToSign = {
    timestamp,
    folder: UPLOAD_FOLDER,
    allowed_formats: ALLOWED_FORMATS,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    timestamp,
    signature,
    folder: UPLOAD_FOLDER,
    allowedFormats: ALLOWED_FORMATS,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  });
}

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireAdminApi } from "@/lib/admin-auth";

// Endpoint de autenticación para subidas directas del navegador a ImageKit.
// Solo un administrador con sesión activa puede solicitar este token.
// La firma HMAC-SHA1 se genera con IMAGEKIT_PRIVATE_KEY en el servidor,
// por lo que la llave privada nunca se expone al cliente.
export async function GET() {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!privateKey || !publicKey) {
    return NextResponse.json(
      { error: "Credenciales de ImageKit no configuradas en el servidor" },
      { status: 500 }
    );
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 1800; // válido por 30 minutos

  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(token + expire)
    .digest("hex");

  return NextResponse.json({
    token,
    expire,
    signature,
    publicKey,
    folder: "/treegold/admin",
    endpoint,
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSessionToken, AUTH_COOKIE, AUTH_SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/client-ip";

// Límite por IP: lo que evita el alta masiva de cuentas basura y, sobre todo,
// que alguien recorra una lista de correos para ver cuáles ya están dados de
// alta. Se consume en CADA petición (también en las que fallan la validación),
// porque si solo contaran los registros correctos el atacante podría enumerar
// gratis. El formulario ya valida en el navegador, así que un usuario real no
// debería gastar más de un par de intentos.
const REGISTER_MAX = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 60 minutos

// Política de contraseña del SERVIDOR: el minLength del formulario es solo
// comodidad para el usuario, con curl se salta. Se sigue NIST SP 800-63B:
// longitud mínima razonable y sin reglas de composición obligatoria (mayúsculas,
// símbolos...), que empeoran las contraseñas reales sin aportar entropía.
const PASSWORD_MIN = 8;
// El máximo no es una regla de seguridad de la contraseña sino un freno de DoS:
// bcrypt es caro a propósito y hashear entradas enormes bloquea el servidor.
// bcrypt trunca a 72 bytes, así que 200 caracteres no recorta nada útil.
const PASSWORD_MAX = 200;
const NAME_MAX = 120;
const EMAIL_MAX = 254; // longitud máxima práctica de una dirección (RFC 5321)

// Validación deliberadamente laxa: la única comprobación seria de un correo es
// enviarle un mensaje. Esto solo descarta basura evidente.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mensaje neutro cuando el correo ya existe.
// HONESTIDAD SOBRE EL ALCANCE: esto NO elimina la enumeración de cuentas. Un
// atacante sigue distinguiendo "registro correcto" de "fallo" por el código de
// estado y por la ausencia de cookie de sesión. La mitigación completa es
// registrar siempre igual y confirmar por correo (verificación de email), que
// hoy está fuera de alcance. Lo que sí conseguimos aquí es (a) no confirmarlo
// por escrito, y (b) el rate limit por IP de arriba, que es la defensa real
// contra la enumeración MASIVA. El texto mantiene la UX: el usuario entiende
// qué hacer a continuación sin que le confirmemos que el correo está registrado.
const NEUTRAL_CONFLICT =
  "No se pudo completar el registro. Si ya tienes una cuenta con este correo, inicia sesión o recupera tu acceso.";

export async function POST(req: Request) {
  try {
    // Sin IP de confianza no hay límite que valga, y aquí el límite por IP es
    // la única defensa contra la enumeración masiva de correos: se rechaza en
    // vez de seguir adelante (ver lib/client-ip.ts).
    const ip = clientIp(req);
    if (!ip) {
      return NextResponse.json(
        { error: "No se pudo procesar la petición. Inténtalo de nuevo más tarde." },
        { status: 503 }
      );
    }

    const ipLimit = rateLimit(`register:ip:${ip}`, REGISTER_MAX, REGISTER_WINDOW_MS);
    if (!ipLimit.allowed) {
      const minutes = Math.max(1, Math.ceil(ipLimit.retryAfterSeconds / 60));
      return NextResponse.json(
        {
          error: `Demasiados registros desde esta conexión. Vuelve a intentarlo en ${minutes} ${
            minutes === 1 ? "minuto" : "minutos"
          }.`,
        },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    const { email, password, name } = await req.json();

    // typeof explícito en todo: el cuerpo es JSON arbitrario y un número o un
    // objeto donde se espera texto reventaría más abajo (o llegaría a la BD).
    if (typeof email !== "string" || typeof password !== "string" || typeof name !== "string") {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    if (!normalizedName) {
      return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
    }
    if (normalizedName.length > NAME_MAX) {
      return NextResponse.json(
        { error: `El nombre no puede superar los ${NAME_MAX} caracteres.` },
        { status: 400 }
      );
    }
    if (normalizedEmail.length > EMAIL_MAX || !EMAIL_RE.test(normalizedEmail)) {
      return NextResponse.json({ error: "Introduce un correo electrónico válido." }, { status: 400 });
    }
    // La contraseña no se recorta con trim: los espacios son caracteres válidos
    // y quitarlos cambiaría en silencio lo que el usuario escribió.
    if (password.length < PASSWORD_MIN) {
      return NextResponse.json(
        { error: `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.` },
        { status: 400 }
      );
    }
    if (password.length > PASSWORD_MAX) {
      return NextResponse.json(
        { error: `La contraseña no puede superar los ${PASSWORD_MAX} caracteres.` },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: NEUTRAL_CONFLICT }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: normalizedName,
        role: "CLIENT",
      },
    });

    const token = await createSessionToken(newUser.id, "CLIENT");
    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    });

    return res;
  } catch (err: unknown) {
    // P2002 = violación de índice único: dos registros del mismo correo a la vez
    // se colaron entre el findUnique y el create. Se responde igual que el caso
    // "ya existe" para no filtrar por la puerta de atrás lo que acabamos de
    // ocultar arriba.
    if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: NEUTRAL_CONFLICT }, { status: 409 });
    }
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

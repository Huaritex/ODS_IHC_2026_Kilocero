import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/auth";
import { ROL_HOME } from "@/lib/constants";
import { bloqueado, limpiar, registrarFallo } from "@/lib/rate-limit";
import type { EstadoVerificacion, Rol } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Ingresá tu correo y contraseña." },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
    const clave = `${ip}|${email}`;
    const espera = bloqueado(clave);
    if (espera > 0) {
      return NextResponse.json(
        { error: `Demasiados intentos. Probá de nuevo en ${espera} min.` },
        { status: 429 }
      );
    }

    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) {
      registrarFallo(clave);
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      registrarFallo(clave);
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos." },
        { status: 401 }
      );
    }

    limpiar(clave);
    const rol = user.rol as Rol;
    const estadoVerificacion = user.estadoVerificacion as EstadoVerificacion;

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      nombre: user.nombre,
      rol,
      estadoVerificacion,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol,
        estadoVerificacion,
      },
      redirectTo: ROL_HOME[rol],
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("Error en /api/auth/login:", error);
    return NextResponse.json(
      { error: "No pudimos iniciar sesión. Verificá la conexión a la base de datos." },
      { status: 500 }
    );
  }
}

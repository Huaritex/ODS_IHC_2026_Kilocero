import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/auth";
import { CENTRO_SANTA_CRUZ, MERCADOS_SANTA_CRUZ, ROL_HOME } from "@/lib/constants";
import type { EstadoVerificacion, Rol } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const rol = body.rol === "RECEPTOR" ? "RECEPTOR" : "COMERCIANTE";
    const telefono = typeof body.telefono === "string" ? body.telefono.trim() : null;
    const mercado = typeof body.mercado === "string" ? body.mercado.trim() : null;
    const puesto = typeof body.puesto === "string" ? body.puesto.trim() : null;
    const organizacion =
      typeof body.organizacion === "string" ? body.organizacion.trim() : null;
    const direccion = typeof body.direccion === "string" ? body.direccion.trim() : null;

    if (!nombre || !email || password.length < 6) {
      return NextResponse.json(
        { error: "Completá nombre, correo válido y contraseña (mínimo 6 caracteres)." },
        { status: 400 }
      );
    }

    if (rol === "RECEPTOR" && !organizacion) {
      return NextResponse.json(
        { error: "Indicá el nombre del comedor, hogar u ONG." },
        { status: 400 }
      );
    }

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta registrada con ese correo." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const mercadoEncontrado = MERCADOS_SANTA_CRUZ.find((m) => m.nombre === mercado);
    const lat = mercadoEncontrado?.lat ?? CENTRO_SANTA_CRUZ.lat;
    const lng = mercadoEncontrado?.lng ?? CENTRO_SANTA_CRUZ.lng;

    // Comerciantes quedan verificados para publicar rápido; receptores requieren aprobación Admin
    const estadoVerificacion = rol === "RECEPTOR" ? "PENDIENTE" : "VERIFICADO";

    const user = await prisma.usuario.create({
      data: {
        nombre,
        email,
        passwordHash,
        rol,
        telefono,
        mercado: rol === "COMERCIANTE" ? mercado || "Mercado Abasto" : null,
        puesto: rol === "COMERCIANTE" ? puesto || "Puesto s/n" : null,
        organizacion: rol === "RECEPTOR" ? organizacion : null,
        estadoVerificacion,
        direccion: direccion || mercadoEncontrado?.direccion || "Santa Cruz de la Sierra",
        lat,
        lng,
      },
    });

    const userRol = user.rol as Rol;
    const userVerif = user.estadoVerificacion as EstadoVerificacion;

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: userRol,
      estadoVerificacion: userVerif,
    });

    const res = NextResponse.json(
      {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: userRol,
          estadoVerificacion: userVerif,
        },
        redirectTo: ROL_HOME[userRol],
      },
      { status: 201 }
    );

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("Error en /api/auth/register:", error);
    return NextResponse.json(
      { error: "No pudimos completar el registro. Intentá nuevamente." },
      { status: 500 }
    );
  }
}

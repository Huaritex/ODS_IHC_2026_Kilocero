import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { limpiarPublicacion } from "@/lib/privacidad";
import { prisma } from "@/lib/prisma";
import {
  editarPublicacion,
  eliminarPublicacion,
  expirarPublicacion,
  reportarPublicacion,
} from "@/lib/publicaciones-acciones";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await context.params;
    const publicacion = await prisma.publicacion.findUnique({
      where: { id },
      include: {
        comerciante: {
          select: {
            id: true,
            nombre: true,
            mercado: true,
            puesto: true,
            telefono: true,
          },
        },
        reservas: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            receptor: {
              select: {
                id: true,
                nombre: true,
                organizacion: true,
                telefono: true,
              },
            },
          },
        },
      },
    });

    if (!publicacion || (publicacion.ocultaPorAdmin && session.rol !== "ADMIN")) {
      return NextResponse.json(
        { error: "Publicación no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      publicacion: limpiarPublicacion(publicacion, session),
    });
  } catch (error) {
    console.error("Error en GET /api/publicaciones/[id]:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const publicacion = await prisma.publicacion.findUnique({ where: { id } });
    if (!publicacion) {
      return NextResponse.json({ error: "Publicación no encontrada." }, { status: 404 });
    }

    const resultado =
      body.accion === "REPORTAR"
        ? await reportarPublicacion(session, publicacion, body)
        : body.accion === "EXPIRAR"
          ? await expirarPublicacion(session, publicacion)
          : body.accion === "EDITAR"
            ? await editarPublicacion(session, publicacion, body)
            : { status: 400, body: { error: "Acción no válida." } };

    return NextResponse.json(resultado.body, { status: resultado.status });
  } catch (error) {
    console.error("Error en PATCH /api/publicaciones/[id]:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const { id } = await context.params;
    const resultado = await eliminarPublicacion(session, id);
    return NextResponse.json(resultado.body, { status: resultado.status });
  } catch (error) {
    console.error("Error en DELETE /api/publicaciones/[id]:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

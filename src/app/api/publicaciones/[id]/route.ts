import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { limpiarPublicacion } from "@/lib/privacidad";
import { prisma } from "@/lib/prisma";

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
    const accion = body.accion as string;

    const publicacion = await prisma.publicacion.findUnique({ where: { id } });
    if (!publicacion) {
      return NextResponse.json(
        { error: "Publicación no encontrada." },
        { status: 404 }
      );
    }

    if (accion === "REPORTAR") {
      if (session.rol !== "RECEPTOR") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      const receptor = await prisma.usuario.findUnique({
        where: { id: session.userId },
        select: { estadoVerificacion: true },
      });
      if (!receptor || receptor.estadoVerificacion !== "VERIFICADO") {
        return NextResponse.json(
          { error: "Solo receptores verificados pueden reportar publicaciones." },
          { status: 403 }
        );
      }
      const motivo =
        typeof body.motivo === "string" && body.motivo.trim().length > 0
          ? body.motivo.trim().slice(0, 200)
          : "Reportado por receptor";
      const updated = await prisma.publicacion.update({
        where: { id },
        data: { reportada: true, motivoReporte: motivo },
      });
      return NextResponse.json({ publicacion: updated });
    }

    if (accion === "EXPIRAR") {
      if (
        session.rol !== "COMERCIANTE" ||
        publicacion.comercianteId !== session.userId
      ) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      const updated = await prisma.publicacion.updateMany({
        where: {
          id,
          comercianteId: session.userId,
          estado: "DISPONIBLE",
        },
        data: { estado: "EXPIRADO" },
      });
      if (updated.count === 0) {
        return NextResponse.json(
          { error: "Solo podés cerrar publicaciones que aún están disponibles." },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (error) {
    console.error("Error en PATCH /api/publicaciones/[id]:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

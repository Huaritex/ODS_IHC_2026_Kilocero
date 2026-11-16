import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelarReservasActivas, registrarAuditoria } from "@/lib/admin-acciones";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const accion = body.accion as "OCULTAR" | "RESTAURAR" | "DESCARTAR_REPORTE";

    const existing = await prisma.publicacion.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Publicación no encontrada." },
        { status: 404 }
      );
    }

    if (accion === "OCULTAR") {
      const updated = await prisma.$transaction(async (tx) => {
        const canceladas = await cancelarReservasActivas(
          tx,
          { publicacionId: id },
          "El administrador ocultó esta publicación por moderación."
        );
        const pub = await tx.publicacion.update({
          where: { id },
          data: { ocultaPorAdmin: true },
        });
        await registrarAuditoria(
          session,
          "PUBLICACION_OCULTADA",
          "PUBLICACION",
          id,
          canceladas > 0 ? `${canceladas} reserva(s) cancelada(s)` : null,
          tx
        );
        return pub;
      });
      return NextResponse.json({ publicacion: updated });
    }

    if (accion === "RESTAURAR") {
      const updated = await prisma.publicacion.update({
        where: { id },
        data: { ocultaPorAdmin: false, reportada: false, motivoReporte: null },
      });
      await registrarAuditoria(session, "PUBLICACION_RESTAURADA", "PUBLICACION", id);
      return NextResponse.json({ publicacion: updated });
    }

    if (accion === "DESCARTAR_REPORTE") {
      const updated = await prisma.publicacion.update({
        where: { id },
        data: { reportada: false, motivoReporte: null },
      });
      await registrarAuditoria(session, "REPORTE_DESCARTADO", "PUBLICACION", id);
      return NextResponse.json({ publicacion: updated });
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (error) {
    console.error("Error en PATCH /api/admin/publicaciones/[id]:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

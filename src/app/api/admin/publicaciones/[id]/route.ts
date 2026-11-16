import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelarReservasActivas, registrarAuditoria } from "@/lib/admin-acciones";
import { borrarFoto } from "@/lib/fotos";

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

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const { id } = await context.params;

    const pub = await prisma.publicacion.findUnique({
      where: { id },
      select: {
        estado: true,
        categoria: true,
        fotoUrl: true,
        comerciante: { select: { nombre: true, puesto: true } },
      },
    });
    if (!pub) {
      return NextResponse.json({ error: "Publicación no encontrada." }, { status: 404 });
    }
    if (pub.estado === "CONFIRMADO" || pub.estado === "RETIRADO") {
      return NextResponse.json(
        { error: "Una entrega realizada cuenta para el impacto y no se puede eliminar." },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const canceladas = await cancelarReservasActivas(
        tx,
        { publicacionId: id },
        "El administrador eliminó esta publicación."
      );
      await registrarAuditoria(
        session,
        "PUBLICACION_ELIMINADA",
        "PUBLICACION",
        id,
        [
          `${pub.categoria} de ${pub.comerciante.puesto || pub.comerciante.nombre}`,
          canceladas > 0 ? `${canceladas} reserva(s) cancelada(s)` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        tx
      );
      await tx.publicacion.delete({ where: { id } });
    });
    await borrarFoto(pub.fotoUrl);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en DELETE /api/admin/publicaciones/[id]:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

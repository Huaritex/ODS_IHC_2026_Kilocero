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
    const decision = body.decision as "VERIFICADO" | "RECHAZADO" | undefined;
    const motivoRechazo =
      typeof body.motivoRechazo === "string"
        ? body.motivoRechazo.trim().slice(0, 200)
        : null;

    if (decision !== "VERIFICADO" && decision !== "RECHAZADO") {
      return NextResponse.json(
        { error: "Decisión inválida. Usá VERIFICADO o RECHAZADO." },
        { status: 400 }
      );
    }

    const receptor = await prisma.usuario.findFirst({
      where: { id, rol: "RECEPTOR" },
      select: { id: true },
    });
    if (!receptor) {
      return NextResponse.json(
        { error: "Receptor no encontrado." },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.usuario.update({
        where: { id },
        data: {
          estadoVerificacion: decision,
          motivoRechazo: decision === "RECHAZADO" ? motivoRechazo : null,
        },
        select: {
          id: true,
          nombre: true,
          organizacion: true,
          estadoVerificacion: true,
          motivoRechazo: true,
        },
      });
      let canceladas = 0;
      if (decision === "RECHAZADO") {
        canceladas = await cancelarReservasActivas(
          tx,
          { receptorId: id },
          "Tu cuenta fue rechazada por el administrador."
        );
      }
      await registrarAuditoria(
        session,
        decision === "VERIFICADO" ? "RECEPTOR_VERIFICADO" : "RECEPTOR_RECHAZADO",
        "USUARIO",
        id,
        [
          u.organizacion || u.nombre,
          motivoRechazo,
          canceladas > 0 ? `${canceladas} reserva(s) cancelada(s)` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        tx
      );
      return u;
    });

    return NextResponse.json({ receptor: updated });
  } catch (error) {
    console.error("Error en PATCH /api/admin/receptores/[id]:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

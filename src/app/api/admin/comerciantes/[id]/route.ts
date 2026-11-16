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
    const accion = body.accion as "SUSPENDER" | "REACTIVAR" | undefined;
    const motivo =
      typeof body.motivo === "string" ? body.motivo.trim().slice(0, 200) : "";

    if (accion !== "SUSPENDER" && accion !== "REACTIVAR") {
      return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
    }

    const local = await prisma.usuario.findFirst({
      where: { id, rol: "COMERCIANTE" },
      select: { id: true, nombre: true, puesto: true },
    });
    if (!local) {
      return NextResponse.json({ error: "Local no encontrado." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      if (accion === "SUSPENDER") {
        await tx.usuario.update({
          where: { id },
          data: { suspendido: true, motivoSuspension: motivo || null },
        });
        const canceladas = await cancelarReservasActivas(
          tx,
          { publicacion: { comercianteId: id } },
          "El local fue suspendido por el administrador."
        );
        const ocultas = await tx.publicacion.updateMany({
          where: {
            comercianteId: id,
            estado: { in: ["DISPONIBLE", "RESERVADO"] },
            ocultaPorAdmin: false,
          },
          data: { ocultaPorAdmin: true },
        });
        await registrarAuditoria(
          session,
          "LOCAL_SUSPENDIDO",
          "USUARIO",
          id,
          [
            local.puesto || local.nombre,
            motivo,
            `${ocultas.count} publicación(es) ocultada(s)`,
            canceladas > 0 ? `${canceladas} reserva(s) cancelada(s)` : null,
          ]
            .filter(Boolean)
            .join(" · "),
          tx
        );
      } else {
        await tx.usuario.update({
          where: { id },
          data: { suspendido: false, motivoSuspension: null },
        });
        await registrarAuditoria(
          session,
          "LOCAL_REACTIVADO",
          "USUARIO",
          id,
          local.puesto || local.nombre,
          tx
        );
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en PATCH /api/admin/comerciantes/[id]:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

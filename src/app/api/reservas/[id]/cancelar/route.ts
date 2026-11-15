import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await context.params;

    await prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id },
        include: { publicacion: true },
      });

      if (!reserva) {
        throw new Error("NOT_FOUND");
      }

      const isOwnerReceptor =
        session.rol === "RECEPTOR" && reserva.receptorId === session.userId;
      const isOwnerComerciante =
        session.rol === "COMERCIANTE" &&
        reserva.publicacion.comercianteId === session.userId;

      if (!isOwnerReceptor && !isOwnerComerciante) {
        throw new Error("FORBIDDEN");
      }

      const updated = await tx.reserva.updateMany({
        where: {
          id: reserva.id,
          estado: "ACTIVA",
          confirmadoReceptor: false,
          confirmadoComerciante: false,
        },
        data: { estado: "CANCELADA" },
      });

      if (updated.count === 0) {
        throw new Error("CANNOT_CANCEL");
      }

      const stillValid = reserva.publicacion.ventanaFin > new Date();
      await tx.publicacion.update({
        where: { id: reserva.publicacionId },
        data: {
          estado: stillValid ? "DISPONIBLE" : "EXPIRADO",
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json(
          { error: "Reserva no encontrada." },
          { status: 404 }
        );
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
      if (error.message === "CANNOT_CANCEL") {
        return NextResponse.json(
          {
            error:
              "No podés cancelar una reserva que ya fue confirmada o cerrada.",
          },
          { status: 400 }
        );
      }
    }
    console.error("Error en POST /api/reservas/[id]/cancelar:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

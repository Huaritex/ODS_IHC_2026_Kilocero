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

    const result = await prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id },
        include: { publicacion: true },
      });

      if (!reserva) {
        throw new Error("NOT_FOUND");
      }
      if (reserva.estado !== "ACTIVA") {
        throw new Error("NOT_ACTIVE");
      }

      const isReceptor =
        session.rol === "RECEPTOR" && reserva.receptorId === session.userId;
      const isComerciante =
        session.rol === "COMERCIANTE" &&
        reserva.publicacion.comercianteId === session.userId;

      if (!isReceptor && !isComerciante) {
        throw new Error("FORBIDDEN");
      }

      const now = new Date();
      const nextConfirmadoReceptor = isReceptor
        ? true
        : reserva.confirmadoReceptor;
      const nextConfirmadoComerciante = isComerciante
        ? true
        : reserva.confirmadoComerciante;
      const ambosConfirmaron =
        nextConfirmadoReceptor && nextConfirmadoComerciante;

      const updatedReserva = await tx.reserva.update({
        where: { id: reserva.id },
        data: {
          confirmadoReceptor: nextConfirmadoReceptor,
          confirmadoComerciante: nextConfirmadoComerciante,
          confirmadoReceptorAt: isReceptor
            ? now
            : reserva.confirmadoReceptorAt,
          confirmadoComercianteAt: isComerciante
            ? now
            : reserva.confirmadoComercianteAt,
          estado: ambosConfirmaron ? "COMPLETADA" : "ACTIVA",
        },
      });

      await tx.publicacion.update({
        where: { id: reserva.publicacionId },
        data: {
          estado: ambosConfirmaron ? "CONFIRMADO" : "RETIRADO",
        },
      });

      return { updatedReserva, ambosConfirmaron };
    });

    return NextResponse.json({
      reserva: result.updatedReserva,
      ambosConfirmaron: result.ambosConfirmaron,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json(
          { error: "Reserva no encontrada." },
          { status: 404 }
        );
      }
      if (error.message === "NOT_ACTIVE") {
        return NextResponse.json(
          { error: "Esta reserva ya no está activa." },
          { status: 400 }
        );
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "No autorizado." }, { status: 403 });
      }
    }
    console.error("Error en POST /api/reservas/[id]/confirmar:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

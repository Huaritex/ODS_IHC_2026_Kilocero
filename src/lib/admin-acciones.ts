import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { SessionPayload } from "@/lib/auth";

type Tx = Prisma.TransactionClient;

export async function registrarAuditoria(
  session: SessionPayload,
  accion: string,
  entidad: "USUARIO" | "PUBLICACION",
  entidadId: string,
  detalle?: string | null,
  tx: Tx | typeof prisma = prisma
) {
  await tx.auditoriaAdmin.create({
    data: {
      adminId: session.userId,
      adminNombre: session.nombre,
      accion,
      entidad,
      entidadId,
      detalle: detalle ?? null,
    },
  });
}

/**
 * Cancela las reservas ACTIVAS (sin confirmar) que cumplan el filtro y
 * devuelve las publicaciones afectadas a DISPONIBLE (o EXPIRADO si venció).
 */
export async function cancelarReservasActivas(
  tx: Tx,
  where: Prisma.ReservaWhereInput,
  motivo: string
): Promise<number> {
  const reservas = await tx.reserva.findMany({
    where: {
      ...where,
      estado: "ACTIVA",
      confirmadoReceptor: false,
      confirmadoComerciante: false,
    },
    select: { id: true, publicacionId: true },
  });
  if (reservas.length === 0) return 0;

  await tx.reserva.updateMany({
    where: { id: { in: reservas.map((r) => r.id) } },
    data: { estado: "CANCELADA", motivoCancelacion: motivo },
  });

  const now = new Date();
  const pubIds = reservas.map((r) => r.publicacionId);
  await tx.publicacion.updateMany({
    where: { id: { in: pubIds }, estado: "RESERVADO", ventanaFin: { gt: now } },
    data: { estado: "DISPONIBLE" },
  });
  await tx.publicacion.updateMany({
    where: { id: { in: pubIds }, estado: "RESERVADO", ventanaFin: { lte: now } },
    data: { estado: "EXPIRADO" },
  });
  return reservas.length;
}

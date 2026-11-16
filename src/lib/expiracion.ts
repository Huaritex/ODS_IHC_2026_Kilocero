import { prisma } from "@/lib/prisma";

/**
 * Marca como EXPIRADO lo vencido:
 *  - publicaciones DISPONIBLE cuya ventana ya terminó
 *  - reservas ACTIVAS sin ninguna confirmación cuya ventana de retiro terminó
 *    (la publicación asociada también pasa a EXPIRADO)
 */
export async function expirarVencidas(): Promise<void> {
  const now = new Date();

  await prisma.publicacion.updateMany({
    where: { estado: "DISPONIBLE", ventanaFin: { lt: now } },
    data: { estado: "EXPIRADO" },
  });

  const vencidas = await prisma.reserva.findMany({
    where: {
      estado: "ACTIVA",
      confirmadoReceptor: false,
      confirmadoComerciante: false,
      ventanaRetiroFin: { lt: now },
    },
    select: { id: true, publicacionId: true },
  });
  if (vencidas.length === 0) return;

  await prisma.$transaction([
    prisma.reserva.updateMany({
      where: { id: { in: vencidas.map((r) => r.id) } },
      data: {
        estado: "EXPIRADA",
        motivoCancelacion: "La ventana de retiro terminó sin concretarse.",
      },
    }),
    prisma.publicacion.updateMany({
      where: {
        id: { in: vencidas.map((r) => r.publicacionId) },
        estado: "RESERVADO",
      },
      data: { estado: "EXPIRADO" },
    }),
  ]);
}

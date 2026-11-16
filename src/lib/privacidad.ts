import type { SessionPayload } from "./auth";

interface PubConContacto {
  comercianteId: string;
  comerciante: { telefono: string | null };
  reservas: { estado: string; receptor: { id: string } }[];
}

/**
 * Aplica reglas de privacidad a una publicación antes de enviarla al cliente:
 * - El teléfono del comerciante solo lo ve su dueño, un admin o el receptor
 *   que tiene una reserva vigente/completada sobre ese aviso.
 * - Los datos de reservas ajenas (receptor, teléfono) nunca se exponen.
 */
export function limpiarPublicacion<T extends PubConContacto>(
  pub: T,
  session: SessionPayload
): T {
  const esAdmin = session.rol === "ADMIN";
  const esDueno =
    session.rol === "COMERCIANTE" && pub.comercianteId === session.userId;
  if (esAdmin || esDueno) return pub;

  const propias = pub.reservas.filter((r) => r.receptor.id === session.userId);
  const tieneReservaVigente = propias.some((r) => r.estado !== "CANCELADA");

  return {
    ...pub,
    reservas: propias,
    comerciante: {
      ...pub.comerciante,
      telefono: tieneReservaVigente ? pub.comerciante.telefono : null,
    },
  };
}

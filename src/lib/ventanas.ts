export const VENTANAS_RAPIDAS = [
  { id: "ahora", label: "Próximas 2 horas" },
  { id: "cierre", label: "Hasta cierre (19:00)" },
  { id: "tarde", label: "17:30 – 19:30" },
];

/** Ventana real de un preset, o null si ese horario ya pasó. */
export function calcularVentana(
  presetId: string
): { inicio: Date; fin: Date } | null {
  const now = new Date();
  if (presetId === "cierre") {
    const fin = new Date(now);
    fin.setHours(19, 0, 0, 0);
    return fin > now ? { inicio: now, fin } : null;
  }
  if (presetId === "tarde") {
    const inicio = new Date(now);
    inicio.setHours(17, 30, 0, 0);
    const fin = new Date(now);
    fin.setHours(19, 30, 0, 0);
    return fin > now ? { inicio: inicio > now ? inicio : now, fin } : null;
  }
  return { inicio: now, fin: new Date(now.getTime() + 2 * 60 * 60 * 1000) };
}

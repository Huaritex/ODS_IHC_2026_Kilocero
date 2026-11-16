/** Utilidades de la pantalla Explorar del receptor. */

export function calcularDistanciaKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function getCountdownInfo(ventanaFinIso: string, nowMs: number) {
  const diffMin = Math.round(
    (new Date(ventanaFinIso).getTime() - nowMs) / 60_000
  );
  if (diffMin <= 0) {
    return {
      texto: "Por cerrar",
      classes: "bg-rose-100 text-rose-950 border-rose-700",
    };
  }
  if (diffMin <= 15) {
    return {
      texto: `Cierra en ${diffMin} min`,
      classes: "bg-rose-100 text-rose-950 border-rose-700",
    };
  }
  if (diffMin <= 45) {
    return {
      texto: `Cierra en ${diffMin} min`,
      classes: "bg-amber-100 text-amber-950 border-amber-700",
    };
  }
  const horas = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return {
    texto: horas > 0 ? `Quedan ${horas}h ${mins}m` : `Quedan ${mins} min`,
    classes: "bg-emerald-100 text-emerald-950 border-emerald-700",
  };
}

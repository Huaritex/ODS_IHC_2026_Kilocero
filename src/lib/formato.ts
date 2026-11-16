/** Hora local corta, p. ej. "07:00 p. m." */
export function formatHora(valor: string | Date): string {
  return new Date(valor).toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Enlace de WhatsApp para un teléfono boliviano (agrega 591 si falta). */
export function formatWhatsappUrl(telefono: string): string {
  const digits = telefono.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("591") ? digits : `591${digits}`}`;
}

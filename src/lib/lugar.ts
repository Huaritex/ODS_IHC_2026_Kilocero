/**
 * Texto de ubicación de un aviso. Siempre usa lo que el comerciante indicó al
 * publicar (direccionTexto), no el puesto de su perfil, que puede ser distinto
 * (p. ej. vende hoy desde otro pasillo).
 */
export function lugarPublicacion(pub: {
  mercado: string;
  direccionTexto: string | null;
}): string {
  const dir = pub.direccionTexto?.trim();
  if (!dir || dir === pub.mercado) return pub.mercado;
  if (dir.toLowerCase().includes(pub.mercado.toLowerCase())) {
    return dir.replace(/\s+-\s+/, " · ");
  }
  return `${pub.mercado} · ${dir}`;
}

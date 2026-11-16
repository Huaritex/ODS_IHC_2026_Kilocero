/**
 * Reglas de negocio de PATCH /api/publicaciones/[id].
 * La ruta (`route.ts`) solo autentica y despacha; cada acción vive aquí y
 * devuelve `{ status, body }` para que sea fácil de leer y de probar.
 */
import type { Publicacion } from "@/generated/prisma/client";
import type { SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { borrarFoto, guardarFoto } from "@/lib/fotos";
import {
  CANTIDADES_APROXIMADAS,
  CATEGORIAS_ALIMENTO,
  MERCADOS_SANTA_CRUZ,
} from "@/lib/constants";

export interface Resultado {
  status: number;
  body: unknown;
}

const ok = (body: unknown): Resultado => ({ status: 200, body });
const fallo = (status: number, error: string): Resultado => ({ status, body: { error } });

const esDueno = (s: SessionPayload, p: Publicacion) =>
  s.rol === "COMERCIANTE" && p.comercianteId === s.userId;

export async function reportarPublicacion(
  s: SessionPayload,
  p: Publicacion,
  body: { motivo?: unknown }
): Promise<Resultado> {
  if (s.rol !== "RECEPTOR") return fallo(403, "No autorizado");
  const receptor = await prisma.usuario.findUnique({
    where: { id: s.userId },
    select: { estadoVerificacion: true },
  });
  if (receptor?.estadoVerificacion !== "VERIFICADO") {
    return fallo(403, "Solo receptores verificados pueden reportar publicaciones.");
  }
  const motivo =
    typeof body.motivo === "string" && body.motivo.trim()
      ? body.motivo.trim().slice(0, 200)
      : "Reportado por receptor";
  const publicacion = await prisma.publicacion.update({
    where: { id: p.id },
    data: { reportada: true, motivoReporte: motivo },
  });
  return ok({ publicacion });
}

export async function expirarPublicacion(
  s: SessionPayload,
  p: Publicacion
): Promise<Resultado> {
  if (!esDueno(s, p)) return fallo(403, "No autorizado");
  const r = await prisma.publicacion.updateMany({
    where: { id: p.id, comercianteId: s.userId, estado: "DISPONIBLE" },
    data: { estado: "EXPIRADO" },
  });
  if (r.count === 0) {
    return fallo(400, "Solo podés cerrar publicaciones que aún están disponibles.");
  }
  return ok({ ok: true });
}

type Cuerpo = Record<string, unknown>;
type Validacion = { data: Record<string, unknown>; fotoAnterior: string | null } | Resultado;

/** Valida los campos enviados y arma el objeto `data` de Prisma (solo lo que cambió). */
async function validarEdicion(body: Cuerpo, p: Publicacion): Promise<Validacion> {
  const data: Record<string, unknown> = {};
  let fotoAnterior: string | null = null;

  if (body.categoria !== undefined) {
    if (!CATEGORIAS_ALIMENTO.some((c) => c.value === body.categoria)) {
      return fallo(400, "Categoría no válida.");
    }
    data.categoria = body.categoria;
  }
  if (body.cantidadAproximada !== undefined) {
    if (!CANTIDADES_APROXIMADAS.some((c) => c.value === body.cantidadAproximada)) {
      return fallo(400, "Cantidad no válida.");
    }
    data.cantidadAproximada = body.cantidadAproximada;
  }
  if (body.descripcion !== undefined) {
    data.descripcion =
      typeof body.descripcion === "string" && body.descripcion.trim()
        ? body.descripcion.trim().slice(0, 140)
        : null;
  }
  if (body.mercado !== undefined) {
    const m = MERCADOS_SANTA_CRUZ.find((x) => x.nombre === body.mercado);
    if (!m) return fallo(400, "Mercado no válido.");
    data.mercado = m.nombre;
    data.lat = m.lat;
    data.lng = m.lng;
  }
  if (body.direccionTexto !== undefined) {
    const dir = typeof body.direccionTexto === "string" ? body.direccionTexto.trim() : "";
    if (!dir) return fallo(400, "Indicá el puesto o pasillo.");
    data.direccionTexto = dir.slice(0, 120);
  }
  if (body.ventanaFin !== undefined) {
    const fin = new Date(body.ventanaFin as string);
    if (Number.isNaN(fin.getTime()) || fin <= new Date() || fin <= p.ventanaInicio) {
      return fallo(400, "La hora límite de retiro debe estar en el futuro.");
    }
    data.ventanaFin = fin;
  }
  if (body.fotoUrl !== undefined) {
    if (typeof body.fotoUrl === "string" && body.fotoUrl.trim()) {
      const nueva = await guardarFoto(body.fotoUrl.trim());
      if (!nueva) return fallo(400, "La foto no es válida (JPG, PNG o WebP, máx. 600 KB).");
      data.fotoUrl = nueva;
    } else {
      data.fotoUrl = null;
    }
    if (data.fotoUrl !== p.fotoUrl) fotoAnterior = p.fotoUrl;
  }
  if (Object.keys(data).length === 0) return fallo(400, "No hay cambios que guardar.");
  return { data, fotoAnterior };
}

export async function editarPublicacion(
  s: SessionPayload,
  p: Publicacion,
  body: Cuerpo
): Promise<Resultado> {
  if (!esDueno(s, p)) return fallo(403, "No autorizado");
  if (p.estado !== "DISPONIBLE") {
    return fallo(409, "Solo podés editar avisos que siguen disponibles.");
  }
  const v = await validarEdicion(body, p);
  if ("status" in v) return v;

  // El estado va en el WHERE: evita editar si alguien reservó justo ahora.
  const r = await prisma.publicacion.updateMany({
    where: { id: p.id, comercianteId: s.userId, estado: "DISPONIBLE" },
    data: v.data,
  });
  if (r.count === 0) return fallo(409, "El aviso fue reservado mientras lo editabas.");
  await borrarFoto(v.fotoAnterior);
  const publicacion = await prisma.publicacion.findUnique({ where: { id: p.id } });
  return ok({ publicacion });
}

export async function eliminarPublicacion(
  s: SessionPayload,
  id: string
): Promise<Resultado> {
  if (s.rol !== "COMERCIANTE") return fallo(403, "No autorizado");
  const pub = await prisma.publicacion.findFirst({
    where: { id, comercianteId: s.userId },
    select: { id: true, estado: true, fotoUrl: true },
  });
  if (!pub) return fallo(404, "Publicación no encontrada.");

  // Solo se borra lo que no tiene entrega en curso ni historial de impacto.
  if (pub.estado !== "DISPONIBLE" && pub.estado !== "EXPIRADO") {
    return fallo(409, "No podés eliminar un aviso reservado o ya entregado.");
  }
  const conHistorial = await prisma.reserva.count({
    where: { publicacionId: id, estado: { in: ["ACTIVA", "COMPLETADA"] } },
  });
  if (conHistorial > 0) return fallo(409, "Este aviso tiene una reserva y no se puede eliminar.");

  await prisma.publicacion.delete({ where: { id } });
  await borrarFoto(pub.fotoUrl);
  return ok({ ok: true });
}

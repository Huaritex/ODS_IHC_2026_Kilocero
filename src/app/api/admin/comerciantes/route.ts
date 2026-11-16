import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CANTIDAD_MAP } from "@/lib/constants";
import type { CantidadAproximada } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const comerciantes = await prisma.usuario.findMany({
    where: { rol: "COMERCIANTE" },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      mercado: true,
      puesto: true,
      suspendido: true,
      motivoSuspension: true,
      createdAt: true,
      publicaciones: {
        select: {
          estado: true,
          reportada: true,
          ocultaPorAdmin: true,
          cantidadAproximada: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const locales = comerciantes.map((c) => {
    const confirmadas = c.publicaciones.filter((p) => p.estado === "CONFIRMADO");
    const kg = confirmadas.reduce(
      (acc, p) =>
        acc +
        (CANTIDAD_MAP[p.cantidadAproximada as CantidadAproximada]
          ?.kgEstimados ?? 0),
      0
    );
    const ultima = c.publicaciones.reduce<Date | null>(
      (max, p) => (!max || p.createdAt > max ? p.createdAt : max),
      null
    );
    return {
      id: c.id,
      nombre: c.nombre,
      email: c.email,
      telefono: c.telefono,
      mercado: c.mercado,
      puesto: c.puesto,
      suspendido: c.suspendido,
      motivoSuspension: c.motivoSuspension,
      createdAt: c.createdAt,
      totalPublicaciones: c.publicaciones.length,
      activas: c.publicaciones.filter(
        (p) => p.estado === "DISPONIBLE" && !p.ocultaPorAdmin
      ).length,
      entregasConfirmadas: confirmadas.length,
      kgRescatados: kg,
      reportadas: c.publicaciones.filter((p) => p.reportada).length,
      ultimaPublicacion: ultima,
    };
  });

  return NextResponse.json({ locales });
}

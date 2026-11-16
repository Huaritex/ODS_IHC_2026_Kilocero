import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/admin-acciones";

export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const receptores = await prisma.usuario.findMany({
    where: { rol: "RECEPTOR" },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      organizacion: true,
      direccion: true,
      estadoVerificacion: true,
      motivoRechazo: true,
      createdAt: true,
    },
    orderBy: [{ estadoVerificacion: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ receptores });
}

/** Aprobación por lote: { ids: string[] } → VERIFICADO */
export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids)
    ? body.ids.filter((x: unknown): x is string => typeof x === "string").slice(0, 100)
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "Sin receptores seleccionados." }, { status: 400 });
  }

  const objetivos = await prisma.usuario.findMany({
    where: { id: { in: ids }, rol: "RECEPTOR", estadoVerificacion: { not: "VERIFICADO" } },
    select: { id: true, nombre: true, organizacion: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.usuario.updateMany({
      where: { id: { in: objetivos.map((o) => o.id) } },
      data: { estadoVerificacion: "VERIFICADO", motivoRechazo: null },
    });
    for (const o of objetivos) {
      await registrarAuditoria(
        session,
        "RECEPTOR_VERIFICADO",
        "USUARIO",
        o.id,
        `${o.organizacion || o.nombre} · aprobación por lote`,
        tx
      );
    }
  });

  return NextResponse.json({ aprobados: objetivos.length });
}

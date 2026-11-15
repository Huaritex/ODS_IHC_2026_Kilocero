import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expirarVencidas } from "@/lib/expiracion";

export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  await expirarVencidas();
  const publicaciones = await prisma.publicacion.findMany({
    include: {
      comerciante: {
        select: { nombre: true, mercado: true, puesto: true },
      },
    },
    orderBy: [{ reportada: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ publicaciones });
}

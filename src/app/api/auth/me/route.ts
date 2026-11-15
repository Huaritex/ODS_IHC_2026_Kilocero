import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      telefono: true,
      mercado: true,
      puesto: true,
      organizacion: true,
      estadoVerificacion: true,
      motivoRechazo: true,
      direccion: true,
      lat: true,
      lng: true,
    },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}

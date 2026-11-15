import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const decision = body.decision as "VERIFICADO" | "RECHAZADO" | undefined;
    const motivoRechazo =
      typeof body.motivoRechazo === "string" ? body.motivoRechazo.trim() : null;

    if (decision !== "VERIFICADO" && decision !== "RECHAZADO") {
      return NextResponse.json(
        { error: "Decisión inválida. Usá VERIFICADO o RECHAZADO." },
        { status: 400 }
      );
    }

    const receptor = await prisma.usuario.findFirst({
      where: { id, rol: "RECEPTOR" },
      select: { id: true },
    });
    if (!receptor) {
      return NextResponse.json(
        { error: "Receptor no encontrado." },
        { status: 404 }
      );
    }

    const updated = await prisma.usuario.update({
      where: { id },
      data: {
        estadoVerificacion: decision,
        motivoRechazo: decision === "RECHAZADO" ? motivoRechazo : null,
      },
      select: {
        id: true,
        nombre: true,
        organizacion: true,
        estadoVerificacion: true,
        motivoRechazo: true,
      },
    });

    return NextResponse.json({ receptor: updated });
  } catch (error) {
    console.error("Error en PATCH /api/admin/receptores/[id]:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

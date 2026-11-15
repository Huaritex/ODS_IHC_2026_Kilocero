import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const tipo = body.tipo as string;

    if (tipo === "TIEMPO_PUBLICACION") {
      if (session.rol !== "COMERCIANTE") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      const segundos = Number(body.valor);
      if (!Number.isFinite(segundos) || segundos <= 0 || segundos > 600) {
        return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
      }
      const metrica = await prisma.metricaUsabilidad.create({
        data: {
          tipo: "TIEMPO_PUBLICACION",
          rol: session.rol,
          valor: Math.round(segundos * 10) / 10,
        },
      });
      return NextResponse.json({ metrica }, { status: 201 });
    }

    if (tipo === "ENCUESTA_SUS") {
      const p1 = Number(body.valor);
      const p2 = Number(body.puntajeSecundario);
      if (
        !Number.isInteger(p1) ||
        !Number.isInteger(p2) ||
        p1 < 1 ||
        p1 > 5 ||
        p2 < 1 ||
        p2 > 5
      ) {
        return NextResponse.json({ error: "Puntaje inválido" }, { status: 400 });
      }
      const metrica = await prisma.metricaUsabilidad.create({
        data: {
          tipo: "ENCUESTA_SUS",
          rol: session.rol,
          valor: p1,
          puntajeSecundario: p2,
        },
      });
      return NextResponse.json({ metrica }, { status: 201 });
    }

    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  } catch (error) {
    console.error("Error en POST /api/metricas:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

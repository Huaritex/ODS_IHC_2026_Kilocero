import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { expirarVencidas } from "@/lib/expiracion";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await expirarVencidas();

    const where =
      session.rol === "RECEPTOR"
        ? { receptorId: session.userId }
        : session.rol === "COMERCIANTE"
          ? { publicacion: { comercianteId: session.userId } }
          : {};

    const reservas = await prisma.reserva.findMany({
      where,
      include: {
        publicacion: {
          include: {
            comerciante: {
              select: {
                id: true,
                nombre: true,
                mercado: true,
                puesto: true,
                telefono: true,
              },
            },
          },
        },
        receptor: {
          select: {
            id: true,
            nombre: true,
            organizacion: true,
            telefono: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reservas });
  } catch (error) {
    console.error("Error en GET /api/reservas:", error);
    return NextResponse.json(
      { error: "Error al cargar reservas." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "RECEPTOR") {
      return NextResponse.json(
        { error: "Solo receptores pueden reservar excedentes." },
        { status: 403 }
      );
    }

    const receptor = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { estadoVerificacion: true },
    });

    if (!receptor || receptor.estadoVerificacion !== "VERIFICADO") {
      return NextResponse.json(
        {
          error:
            "Tu cuenta aún está pendiente de verificación por el equipo administrador.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const publicacionId =
      typeof body.publicacionId === "string" ? body.publicacionId : "";

    if (!publicacionId) {
      return NextResponse.json(
        { error: "Falta el identificador de la publicación." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const updated = await tx.publicacion.updateMany({
        where: {
          id: publicacionId,
          estado: "DISPONIBLE",
          ocultaPorAdmin: false,
          ventanaFin: { gt: now },
        },
        data: { estado: "RESERVADO" },
      });

      const pub = await tx.publicacion.findUnique({
        where: { id: publicacionId },
      });

      if (updated.count === 0) {
        if (!pub || pub.ocultaPorAdmin) {
          throw new Error("NOT_FOUND");
        }
        if (pub.estado === "DISPONIBLE" && pub.ventanaFin <= now) {
          await tx.publicacion.update({
            where: { id: pub.id },
            data: { estado: "EXPIRADO" },
          });
          throw new Error("EXPIRED");
        }
        throw new Error("NOT_AVAILABLE");
      }

      if (!pub) {
        throw new Error("NOT_FOUND");
      }

      const ventanaRetiroInicio = body.ventanaRetiroInicio
        ? new Date(body.ventanaRetiroInicio)
        : pub.ventanaInicio;
      const ventanaRetiroFin = body.ventanaRetiroFin
        ? new Date(body.ventanaRetiroFin)
        : pub.ventanaFin;

      if (
        Number.isNaN(ventanaRetiroInicio.getTime()) ||
        Number.isNaN(ventanaRetiroFin.getTime()) ||
        ventanaRetiroFin <= ventanaRetiroInicio
      ) {
        throw new Error("INVALID_DATES");
      }

      let codigoRetiro = "";
      for (let i = 0; i < 20; i++) {
        const candidato = `KC-${randomInt(1000, 10000)}`;
        const usado = await tx.reserva.findFirst({
          where: { codigoRetiro: candidato, estado: "ACTIVA" },
          select: { id: true },
        });
        if (!usado) {
          codigoRetiro = candidato;
          break;
        }
      }
      if (!codigoRetiro) throw new Error("NOT_AVAILABLE");

      const reserva = await tx.reserva.create({
        data: {
          publicacionId: pub.id,
          receptorId: session.userId,
          codigoRetiro,
          ventanaRetiroInicio,
          ventanaRetiroFin,
          estado: "ACTIVA",
        },
      });

      return reserva;
    });

    return NextResponse.json({ reserva: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NOT_FOUND") {
        return NextResponse.json(
          { error: "La publicación no existe o fue retirada." },
          { status: 404 }
        );
      }
      if (error.message === "NOT_AVAILABLE") {
        return NextResponse.json(
          { error: "Este excedente ya fue reservado por otro comedor." },
          { status: 409 }
        );
      }
      if (error.message === "EXPIRED") {
        return NextResponse.json(
          { error: "La ventana horaria de este excedente ya terminó." },
          { status: 409 }
        );
      }
      if (error.message === "INVALID_DATES") {
        return NextResponse.json(
          { error: "Las fechas de retiro enviadas no son válidas." },
          { status: 400 }
        );
      }
    }
    console.error("Error en POST /api/reservas:", error);
    return NextResponse.json(
      { error: "No pudimos completar la reserva." },
      { status: 500 }
    );
  }
}

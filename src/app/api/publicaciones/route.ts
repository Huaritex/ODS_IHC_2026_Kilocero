import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CantidadAproximada, CategoriaAlimento } from "@/lib/types";
import {
  CANTIDADES_APROXIMADAS,
  CATEGORIAS_ALIMENTO,
} from "@/lib/constants";

async function expirarVencidas() {
  const now = new Date();
  await prisma.publicacion.updateMany({
    where: {
      estado: "DISPONIBLE",
      ventanaFin: { lt: now },
    },
    data: { estado: "EXPIRADO" },
  });
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await expirarVencidas();

    const { searchParams } = new URL(req.url);
    const mine = searchParams.get("mine") === "1";
    const categoria = searchParams.get("categoria") as CategoriaAlimento | null;

    const where: Prisma.PublicacionWhereInput = {};

    if (mine && session.rol === "COMERCIANTE") {
      where.comercianteId = session.userId;
    } else {
      where.estado = "DISPONIBLE";
      where.ocultaPorAdmin = false;
      if (categoria) {
        where.categoria = categoria;
      }
    }

    const publicaciones = await prisma.publicacion.findMany({
      where,
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
        reservas: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            receptor: {
              select: {
                id: true,
                nombre: true,
                organizacion: true,
                telefono: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ publicaciones });
  } catch (error) {
    console.error("Error en GET /api/publicaciones:", error);
    return NextResponse.json(
      { error: "Error al cargar publicaciones." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "COMERCIANTE") {
      return NextResponse.json(
        { error: "Solo comerciantes pueden publicar excedentes." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const categoria = body.categoria as CategoriaAlimento | undefined;
    const cantidadAproximada = body.cantidadAproximada as
      | CantidadAproximada
      | undefined;
    const descripcion =
      typeof body.descripcion === "string" ? body.descripcion.trim().slice(0, 140) : null;
    const fotoUrl =
      typeof body.fotoUrl === "string" && body.fotoUrl.trim().length > 0
        ? body.fotoUrl.trim()
        : null;
    const mercado =
      typeof body.mercado === "string" ? body.mercado.trim() : "Mercado Abasto";
    const direccionTexto =
      typeof body.direccionTexto === "string" && body.direccionTexto.trim().length > 0
        ? body.direccionTexto.trim()
        : mercado;
    const lat = typeof body.lat === "number" ? body.lat : -17.7958;
    const lng = typeof body.lng === "number" ? body.lng : -63.1965;

    const categoriaValida = CATEGORIAS_ALIMENTO.some(
      (c) => c.value === categoria
    );
    const cantidadValida = CANTIDADES_APROXIMADAS.some(
      (c) => c.value === cantidadAproximada
    );

    if (
      !categoria ||
      !cantidadAproximada ||
      !categoriaValida ||
      !cantidadValida
    ) {
      return NextResponse.json(
        { error: "Elegí una categoría de alimento y cantidad válidas." },
        { status: 400 }
      );
    }

    const ventanaInicio = body.ventanaInicio
      ? new Date(body.ventanaInicio)
      : new Date();
    const ventanaFin = body.ventanaFin
      ? new Date(body.ventanaFin)
      : new Date(Date.now() + 2 * 60 * 60 * 1000);

    if (
      Number.isNaN(ventanaInicio.getTime()) ||
      Number.isNaN(ventanaFin.getTime()) ||
      ventanaFin <= ventanaInicio ||
      ventanaFin <= new Date()
    ) {
      return NextResponse.json(
        { error: "La ventana horaria de retiro debe terminar en el futuro." },
        { status: 400 }
      );
    }

    const publicacion = await prisma.publicacion.create({
      data: {
        comercianteId: session.userId,
        categoria,
        cantidadAproximada,
        descripcion,
        fotoUrl,
        mercado,
        direccionTexto,
        lat,
        lng,
        ventanaInicio,
        ventanaFin,
        estado: "DISPONIBLE",
      },
    });

    return NextResponse.json({ publicacion }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/publicaciones:", error);
    return NextResponse.json(
      { error: "No pudimos guardar la publicación." },
      { status: 500 }
    );
  }
}

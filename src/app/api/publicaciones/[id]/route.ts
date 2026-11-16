import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { limpiarPublicacion } from "@/lib/privacidad";
import { prisma } from "@/lib/prisma";
import { borrarFoto, guardarFoto } from "@/lib/fotos";
import { CANTIDADES_APROXIMADAS, CATEGORIAS_ALIMENTO } from "@/lib/constants";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await context.params;
    const publicacion = await prisma.publicacion.findUnique({
      where: { id },
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
    });

    if (!publicacion || (publicacion.ocultaPorAdmin && session.rol !== "ADMIN")) {
      return NextResponse.json(
        { error: "Publicación no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      publicacion: limpiarPublicacion(publicacion, session),
    });
  } catch (error) {
    console.error("Error en GET /api/publicaciones/[id]:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const accion = body.accion as string;

    const publicacion = await prisma.publicacion.findUnique({ where: { id } });
    if (!publicacion) {
      return NextResponse.json(
        { error: "Publicación no encontrada." },
        { status: 404 }
      );
    }

    if (accion === "REPORTAR") {
      if (session.rol !== "RECEPTOR") {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      const receptor = await prisma.usuario.findUnique({
        where: { id: session.userId },
        select: { estadoVerificacion: true },
      });
      if (!receptor || receptor.estadoVerificacion !== "VERIFICADO") {
        return NextResponse.json(
          { error: "Solo receptores verificados pueden reportar publicaciones." },
          { status: 403 }
        );
      }
      const motivo =
        typeof body.motivo === "string" && body.motivo.trim().length > 0
          ? body.motivo.trim().slice(0, 200)
          : "Reportado por receptor";
      const updated = await prisma.publicacion.update({
        where: { id },
        data: { reportada: true, motivoReporte: motivo },
      });
      return NextResponse.json({ publicacion: updated });
    }

    if (accion === "EXPIRAR") {
      if (
        session.rol !== "COMERCIANTE" ||
        publicacion.comercianteId !== session.userId
      ) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      const updated = await prisma.publicacion.updateMany({
        where: {
          id,
          comercianteId: session.userId,
          estado: "DISPONIBLE",
        },
        data: { estado: "EXPIRADO" },
      });
      if (updated.count === 0) {
        return NextResponse.json(
          { error: "Solo podés cerrar publicaciones que aún están disponibles." },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (accion === "EDITAR") {
      if (
        session.rol !== "COMERCIANTE" ||
        publicacion.comercianteId !== session.userId
      ) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
      if (publicacion.estado !== "DISPONIBLE") {
        return NextResponse.json(
          { error: "Solo podés editar avisos que siguen disponibles." },
          { status: 409 }
        );
      }

      const data: Record<string, unknown> = {};

      if (body.categoria !== undefined) {
        if (!CATEGORIAS_ALIMENTO.some((c) => c.value === body.categoria)) {
          return NextResponse.json({ error: "Categoría no válida." }, { status: 400 });
        }
        data.categoria = body.categoria;
      }
      if (body.cantidadAproximada !== undefined) {
        if (!CANTIDADES_APROXIMADAS.some((c) => c.value === body.cantidadAproximada)) {
          return NextResponse.json({ error: "Cantidad no válida." }, { status: 400 });
        }
        data.cantidadAproximada = body.cantidadAproximada;
      }
      if (body.descripcion !== undefined) {
        data.descripcion =
          typeof body.descripcion === "string" && body.descripcion.trim()
            ? body.descripcion.trim().slice(0, 140)
            : null;
      }
      if (body.ventanaFin !== undefined) {
        const fin = new Date(body.ventanaFin);
        if (Number.isNaN(fin.getTime()) || fin <= new Date() || fin <= publicacion.ventanaInicio) {
          return NextResponse.json(
            { error: "La hora límite de retiro debe estar en el futuro." },
            { status: 400 }
          );
        }
        data.ventanaFin = fin;
      }
      let fotoAnterior: string | null = null;
      if (body.fotoUrl !== undefined) {
        if (typeof body.fotoUrl === "string" && body.fotoUrl.trim()) {
          const nueva = await guardarFoto(body.fotoUrl.trim());
          if (!nueva) {
            return NextResponse.json(
              { error: "La foto no es válida (JPG, PNG o WebP, máx. 600 KB)." },
              { status: 400 }
            );
          }
          data.fotoUrl = nueva;
        } else {
          data.fotoUrl = null;
        }
        if (data.fotoUrl !== publicacion.fotoUrl) fotoAnterior = publicacion.fotoUrl;
      }
      if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "No hay cambios que guardar." }, { status: 400 });
      }

      // Condición de estado en el WHERE: evita editar si alguien reservó justo ahora.
      const res = await prisma.publicacion.updateMany({
        where: { id, comercianteId: session.userId, estado: "DISPONIBLE" },
        data,
      });
      if (res.count === 0) {
        return NextResponse.json(
          { error: "El aviso fue reservado mientras lo editabas." },
          { status: 409 }
        );
      }
      await borrarFoto(fotoAnterior);
      const actualizada = await prisma.publicacion.findUnique({ where: { id } });
      return NextResponse.json({ publicacion: actualizada });
    }

    return NextResponse.json({ error: "Acción no válida." }, { status: 400 });
  } catch (error) {
    console.error("Error en PATCH /api/publicaciones/[id]:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.rol !== "COMERCIANTE") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const { id } = await context.params;

    const pub = await prisma.publicacion.findFirst({
      where: { id, comercianteId: session.userId },
      select: { id: true, estado: true, fotoUrl: true },
    });
    if (!pub) {
      return NextResponse.json({ error: "Publicación no encontrada." }, { status: 404 });
    }

    // Solo se borra lo que no tiene entrega en curso ni historial de impacto.
    if (pub.estado !== "DISPONIBLE" && pub.estado !== "EXPIRADO") {
      return NextResponse.json(
        { error: "No podés eliminar un aviso reservado o ya entregado." },
        { status: 409 }
      );
    }
    const conHistorial = await prisma.reserva.count({
      where: { publicacionId: id, estado: { in: ["ACTIVA", "COMPLETADA"] } },
    });
    if (conHistorial > 0) {
      return NextResponse.json(
        { error: "Este aviso tiene una reserva y no se puede eliminar." },
        { status: 409 }
      );
    }

    await prisma.publicacion.delete({ where: { id } });
    await borrarFoto(pub.fotoUrl);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en DELETE /api/publicaciones/[id]:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

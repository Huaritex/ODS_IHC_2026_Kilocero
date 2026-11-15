import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CANTIDAD_MAP, CATEGORIA_MAP, KG_POR_COMIDA } from "@/lib/constants";
import type { CantidadAproximada, CategoriaAlimento } from "@/lib/types";

function escapeCsv(val: string | number | null | undefined): string {
  const raw = String(val ?? "");
  // Prevenir CSV Formula Injection (CWE-1236)
  const sanitized = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (
    sanitized.includes(",") ||
    sanitized.includes('"') ||
    sanitized.includes("\n")
  ) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const entregas = await prisma.publicacion.findMany({
      where: { estado: "CONFIRMADO" },
      include: {
        comerciante: { select: { nombre: true, mercado: true, puesto: true } },
        reservas: {
          where: { estado: "COMPLETADA" },
          take: 1,
          include: {
            receptor: { select: { nombre: true, organizacion: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const headers = [
      "Fecha",
      "Mercado",
      "Comerciante",
      "Categoria",
      "Cantidad",
      "Kg Estimados",
      "Comidas Equivalentes",
      "Receptor",
      "Codigo Retiro",
    ];

    const rows = entregas.map((p) => {
      const cat =
        CATEGORIA_MAP[p.categoria as CategoriaAlimento]?.label || p.categoria;
      const cant = CANTIDAD_MAP[p.cantidadAproximada as CantidadAproximada];
      const kg = cant?.kgEstimados ?? 0;
      const comidas = Math.round(kg / KG_POR_COMIDA);
      const reserva = p.reservas[0];
      const receptor =
        reserva?.receptor?.organizacion || reserva?.receptor?.nombre || "N/D";

      return [
        escapeCsv(new Date(p.updatedAt).toLocaleDateString("es-BO")),
        escapeCsv(p.mercado),
        escapeCsv(p.comerciante.nombre),
        escapeCsv(cat),
        escapeCsv(cant?.label || p.cantidadAproximada),
        escapeCsv(kg),
        escapeCsv(comidas),
        escapeCsv(receptor),
        escapeCsv(reserva?.codigoRetiro || "-"),
      ].join(",");
    });

    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="kilo-cero-impacto.csv"',
      },
    });
  } catch (error) {
    console.error("Error en GET /api/admin/exportar:", error);
    return NextResponse.json(
      { error: "No se pudo generar el reporte CSV." },
      { status: 500 }
    );
  }
}

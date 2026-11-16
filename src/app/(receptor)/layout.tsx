import React from "react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleHeader } from "@/components/RoleHeader";
import { EstadoVerificacionBadge } from "@/components/ui/EstadoBadge";
import type { EstadoVerificacion } from "@/lib/types";
import { AccionPrincipalHome } from "@/components/AccionPrincipalHome";

export const dynamic = "force-dynamic";

export default async function ReceptorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["RECEPTOR"]);
  const user = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: {
      nombre: true,
      organizacion: true,
      estadoVerificacion: true,
      motivoRechazo: true,
    },
  });

  const estado = (user?.estadoVerificacion ||
    session.estadoVerificacion) as EstadoVerificacion;

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <RoleHeader
        title={user?.organizacion || session.nombre}
        subtitle={`Responsable: ${user?.nombre || session.nombre}`}
        rolLabel="Receptor / ONG"
        maxWidthClass="max-w-2xl lg:max-w-4xl"
      />

      <main className="mx-auto max-w-2xl lg:max-w-4xl px-4 py-5">
        <AccionPrincipalHome variante="receptor" />
        {estado !== "VERIFICADO" && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border-2 border-amber-700 bg-amber-50 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black text-slate-950">
                Estado de cuenta:
              </p>
              <EstadoVerificacionBadge estado={estado} />
            </div>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {estado === "PENDIENTE"
                ? "Podés explorar los excedentes disponibles, pero necesitás la aprobación del administrador para poder reservar."
                : `Tu solicitud fue rechazada${user?.motivoRechazo ? `: ${user.motivoRechazo}` : "."}`}
            </p>
          </div>
        )}
        {children}
      </main>

    </div>
  );
}

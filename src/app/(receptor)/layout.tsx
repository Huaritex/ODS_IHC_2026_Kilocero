import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleHeader } from "@/components/RoleHeader";
import { EstadoVerificacionBadge } from "@/components/ui/EstadoBadge";
import type { EstadoVerificacion } from "@/lib/types";
import { Map, ClipboardList } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 pb-24">
      <RoleHeader
        title={user?.organizacion || session.nombre}
        subtitle={`Responsable: ${user?.nombre || session.nombre}`}
        rolLabel="Receptor / ONG"
      />

      <main className="mx-auto max-w-2xl px-4 py-5">
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

      <nav
        aria-label="Navegación de receptor"
        className="fixed right-0 bottom-0 left-0 z-40 border-t-2 border-slate-900 bg-white px-3 py-2 shadow-lg"
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/receptor"
            className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-sky-900 px-3 text-base font-extrabold text-white hover:bg-sky-950"
          >
            <Map className="h-5 w-5" aria-hidden="true" />
            <span>Explorar</span>
          </Link>
          <Link
            href="/receptor/reservas"
            className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-3 text-base font-extrabold text-slate-950 hover:bg-slate-100"
          >
            <ClipboardList className="h-5 w-5" aria-hidden="true" />
            <span>Mis reservas</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

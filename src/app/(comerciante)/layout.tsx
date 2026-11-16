import React from "react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleHeader } from "@/components/RoleHeader";
import { AccionPrincipalHome } from "@/components/AccionPrincipalHome";

export const dynamic = "force-dynamic";

export default async function ComercianteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["COMERCIANTE"]);
  const user = await prisma.usuario.findUnique({
    where: { id: session.userId },
    select: {
      nombre: true,
      mercado: true,
      puesto: true,
      suspendido: true,
      motivoSuspension: true,
    },
  });

  const subtitle = [user?.mercado, user?.puesto].filter(Boolean).join(" · ") || "Santa Cruz";

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      <RoleHeader
        title={`Hola, ${user?.nombre || session.nombre}`}
        subtitle={subtitle}
        rolLabel="Comerciante"
        maxWidthClass="max-w-lg md:max-w-2xl"
      />
      <main className="mx-auto max-w-lg md:max-w-2xl px-4 py-5">
        <AccionPrincipalHome variante="comerciante" />
        {user?.suspendido && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border-2 border-rose-800 bg-rose-50 p-4 text-sm font-bold text-rose-950"
          >
            Tu cuenta está suspendida y no podés publicar
            {user.motivoSuspension ? `: ${user.motivoSuspension}` : "."}{" "}
            Contactá al equipo administrador.
          </div>
        )}
        {children}
      </main>

    </div>
  );
}

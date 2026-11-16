import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleHeader } from "@/components/RoleHeader";
import { ListChecks, PlusCircle } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <RoleHeader
        title={`Hola, ${user?.nombre || session.nombre}`}
        subtitle={subtitle}
        rolLabel="Comerciante"
        maxWidthClass="max-w-lg md:max-w-2xl"
      />
      <main className="mx-auto max-w-lg md:max-w-2xl px-4 py-5">
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

      {/* Barra inferior en zona del pulgar (targets >= 48x48px) */}
      <nav
        aria-label="Navegación de comerciante"
        className="fixed right-0 bottom-0 left-0 z-40 border-t-2 border-slate-900 bg-white px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg"
      >
        <div className="mx-auto flex max-w-lg md:max-w-2xl items-center gap-3">
          <Link
            href="/comerciante"
            className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-3 text-sm font-extrabold text-slate-950 hover:bg-slate-100"
          >
            <ListChecks className="h-5 w-5" aria-hidden="true" />
            <span>Mis avisos</span>
          </Link>
          <Link
            href="/comerciante/publicar"
            className="flex min-h-[52px] flex-[1.4] items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 text-base font-extrabold text-white hover:bg-emerald-900"
          >
            <PlusCircle className="h-5 w-5" aria-hidden="true" />
            <span>Publicar excedente</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

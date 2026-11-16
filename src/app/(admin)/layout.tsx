import React from "react";
import { requireRole } from "@/lib/auth";
import { RoleHeader } from "@/components/RoleHeader";
import { AdminNav } from "@/components/AdminNav";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["ADMIN"]);
  const [pendientes, reportadas] = await Promise.all([
    prisma.usuario.count({
      where: { rol: "RECEPTOR", estadoVerificacion: "PENDIENTE" },
    }),
    prisma.publicacion.count({
      where: { reportada: true, ocultaPorAdmin: false },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-100">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-slate-950 focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido principal
      </a>

      <RoleHeader
        title="Administración · Kilo Cero"
        subtitle={`Sesión: ${session.nombre}`}
        rolLabel="Admin"
        maxWidthClass="max-w-6xl"
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <aside
          aria-label="Menú de administración"
          className="sticky top-0 z-20 -mt-2 bg-slate-100 py-2 lg:static lg:z-auto lg:mt-0 lg:py-0"
        >
          <AdminNav
            badges={{
              "/admin/receptores": pendientes,
              "/admin/publicaciones": reportadas,
            }}
          />
        </aside>

        <main id="admin-main" tabIndex={-1} className="min-w-0 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

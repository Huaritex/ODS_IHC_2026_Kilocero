import React from "react";
import { requireRole } from "@/lib/auth";
import { RoleHeader } from "@/components/RoleHeader";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["ADMIN"]);

  return (
    <div className="min-h-screen bg-slate-100">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-slate-950 focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido principal
      </a>

      <RoleHeader
        title="Panel de Administración · Kilo Cero"
        subtitle={`Sesión: ${session.nombre}`}
        rolLabel="Admin"
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[240px_1fr]">
        <aside aria-label="Menú de administración">
          <AdminNav />
        </aside>

        <main id="admin-main" tabIndex={-1} className="min-w-0 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

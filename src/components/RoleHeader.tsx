"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

interface RoleHeaderProps {
  title: string;
  subtitle: string;
  rolLabel: string;
}

export function RoleHeader({ title, subtitle, rolLabel }: RoleHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b-2 border-slate-900 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-block rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white">
            {rolLabel}
          </span>
          <h1 className="truncate text-lg font-black text-slate-950">
            {title}
          </h1>
          <p className="truncate text-xs font-semibold text-slate-700">
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Salir de la sesión"
          className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-900 bg-white px-3 text-sm font-extrabold text-slate-950 hover:bg-slate-100 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-xs font-extrabold sm:text-sm">Salir</span>
        </button>
      </div>
    </header>
  );
}

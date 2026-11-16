"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, ShieldAlert, Store, ScrollText } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Dashboard impacto", icon: BarChart3 },
  { href: "/admin/receptores", label: "Verificar receptores", icon: Users },
  { href: "/admin/locales", label: "Locales", icon: Store },
  {
    href: "/admin/publicaciones",
    label: "Moderar publicaciones",
    icon: ShieldAlert,
  },
  { href: "/admin/auditoria", label: "Auditoría", icon: ScrollText },
];

export function AdminNav({
  badges = {},
}: {
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones de administración"
      className="-mx-4 flex flex-row gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
    >
      {LINKS.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[48px] shrink-0 items-center gap-2.5 rounded-xl border-2 px-4 text-sm font-extrabold transition ${
              active
                ? "border-slate-950 bg-slate-900 text-white"
                : "border-slate-900 bg-white text-slate-950 hover:bg-slate-200"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
            {(badges[item.href] ?? 0) > 0 && (
              <span
                className={`ml-auto min-w-[1.5rem] rounded-full px-2 py-0.5 text-center text-xs font-black ${
                  active ? "bg-white text-slate-950" : "bg-rose-700 text-white"
                }`}
              >
                <span className="sr-only">Pendientes: </span>
                {badges[item.href]}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

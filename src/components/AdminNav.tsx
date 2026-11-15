"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Users, ShieldAlert } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Dashboard impacto", icon: BarChart3 },
  { href: "/admin/receptores", label: "Verificar receptores", icon: Users },
  {
    href: "/admin/publicaciones",
    label: "Moderar publicaciones",
    icon: ShieldAlert,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row gap-2 overflow-x-auto md:flex-col">
      {LINKS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
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
          </Link>
        );
      })}
    </nav>
  );
}

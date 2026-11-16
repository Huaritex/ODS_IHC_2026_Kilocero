"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, PlusCircle } from "lucide-react";

const VARIANTES = {
  comerciante: {
    home: "/comerciante",
    href: "/comerciante/publicar",
    label: "Publicar excedente",
    Icono: PlusCircle,
    clases: "bg-emerald-800 hover:bg-emerald-900",
  },
  receptor: {
    home: "/receptor",
    href: "/receptor/reservas",
    label: "Mis reservas",
    Icono: ClipboardList,
    clases: "bg-sky-900 hover:bg-sky-950",
  },
} as const;

/**
 * Acción principal de cada rol: aparece solo en la pantalla principal, arriba
 * del contenido (visible apenas se entra, sin hacer scroll) y se queda pegada
 * al borde superior mientras se desplaza la lista. En las demás pantallas no
 * ocupa espacio (cada una trae su enlace "Volver").
 */
export function AccionPrincipalHome({
  variante,
}: {
  variante: keyof typeof VARIANTES;
}) {
  const pathname = usePathname();
  const v = VARIANTES[variante];
  if (pathname !== v.home) return null;

  return (
    <div className="sticky top-2 z-30 mb-4">
      <Link
        href={v.href}
        className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-950 px-5 text-base font-extrabold text-white shadow-lg ${v.clases}`}
      >
        <v.Icono className="h-5 w-5" aria-hidden="true" />
        <span>{v.label}</span>
      </Link>
    </div>
  );
}

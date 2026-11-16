import type { ButtonHTMLAttributes, ComponentType } from "react";

type Variante = "aprobar" | "peligro" | "neutro" | "oscuro";

const ESTILOS: Record<Variante, string> = {
  aprobar: "bg-emerald-800 text-white hover:bg-emerald-900",
  oscuro: "bg-slate-900 text-white hover:bg-slate-800",
  peligro: "border-2 border-rose-800 bg-white text-rose-900 hover:bg-rose-50",
  neutro: "border-2 border-slate-800 bg-white text-slate-950 hover:bg-slate-100",
};

/** Botón de acción de tabla/tarjeta con objetivo táctil ≥48 px e ícono decorativo. */
export function BotonAccion({
  icono: Icono,
  variante,
  full,
  children,
  ...rest
}: {
  icono: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  variante: Variante;
  full?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs font-extrabold disabled:opacity-60 ${
        full ? "w-full" : ""
      } ${ESTILOS[variante]}`}
    >
      <Icono className="h-4 w-4" aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}

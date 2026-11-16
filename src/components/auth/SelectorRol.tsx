import { HeartHandshake, Store } from "lucide-react";

export type RolRegistro = "COMERCIANTE" | "RECEPTOR";

const OPCIONES = [
  { value: "COMERCIANTE", label: "Comerciante", Icono: Store, activo: "border-emerald-900 bg-emerald-100 text-emerald-950" },
  { value: "RECEPTOR", label: "Comedor / ONG", Icono: HeartHandshake, activo: "border-sky-900 bg-sky-100 text-sky-950" },
] as const;

/** Radiogrupo accesible para elegir el rol al registrarse. */
export function SelectorRol({
  value,
  onChange,
}: {
  value: RolRegistro;
  onChange: (v: RolRegistro) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-extrabold text-slate-950">¿Cuál es tu rol?</legend>
      <div role="radiogroup" aria-label="Selección de rol" className="mt-2 grid grid-cols-2 gap-3">
        {OPCIONES.map(({ value: v, label, Icono, activo }) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 text-sm font-extrabold ${
              value === v ? activo : "border-slate-300 bg-white text-slate-800"
            }`}
          >
            <Icono className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

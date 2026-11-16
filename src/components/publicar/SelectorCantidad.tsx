import type { CantidadAproximada } from "@/lib/types";
import { CANTIDADES_APROXIMADAS } from "@/lib/constants";

export function SelectorCantidad({
  legend,
  value,
  onChange,
}: {
  legend: string;
  value: CantidadAproximada | null;
  onChange: (v: CantidadAproximada) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-black uppercase tracking-wide text-slate-950">
        {legend}
      </legend>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {CANTIDADES_APROXIMADAS.map((c) => {
          const selected = value === c.value;
          return (
            <button
              key={c.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(c.value)}
              className={`flex min-h-[68px] flex-col items-center justify-center rounded-2xl border-2 p-2 text-center ${
                selected
                  ? "border-emerald-950 bg-emerald-100 text-emerald-950"
                  : "border-slate-300 bg-white text-slate-900 hover:border-slate-600"
              }`}
            >
              <span className="text-base font-black">{c.label}</span>
              <span className="mt-0.5 text-[11px] font-bold leading-tight text-slate-700">
                {c.referencia}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

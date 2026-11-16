import type { CategoriaAlimento } from "@/lib/types";
import { CATEGORIAS_ALIMENTO } from "@/lib/constants";

export function SelectorCategoria({
  legend,
  value,
  onChange,
}: {
  legend: string;
  value: CategoriaAlimento | null;
  onChange: (v: CategoriaAlimento) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-black uppercase tracking-wide text-slate-950">
        {legend}
      </legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {CATEGORIAS_ALIMENTO.map((cat) => {
          const selected = value === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(cat.value)}
              className={`flex min-h-[58px] items-center gap-2.5 rounded-2xl border-2 px-3 py-2 text-left transition ${
                selected
                  ? "border-emerald-950 bg-emerald-100 text-emerald-950 shadow-sm"
                  : "border-slate-300 bg-white text-slate-900 hover:border-slate-600"
              }`}
            >
              <span className="text-2xl leading-none" aria-hidden="true">
                {cat.emoji}
              </span>
              <span className="text-sm font-extrabold leading-tight">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

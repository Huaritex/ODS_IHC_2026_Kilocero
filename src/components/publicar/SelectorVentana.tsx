"use client";

import { formatHora } from "@/lib/formato";
import { calcularVentana, VENTANAS_RAPIDAS } from "@/lib/ventanas";

/** Ventanas de retiro rápidas; deshabilita las que ya pasaron. */
export function SelectorVentana({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-black uppercase tracking-wide text-slate-950">
        3. ¿Hasta cuándo pueden retirar?
      </legend>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {VENTANAS_RAPIDAS.map((v) => {
          const real = calcularVentana(v.id);
          const selected = value === v.id;
          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={selected}
              disabled={!real}
              onClick={() => onChange(v.id)}
              className={`flex min-h-[56px] flex-col items-center justify-center rounded-2xl border-2 p-2 text-center disabled:cursor-not-allowed disabled:opacity-50 ${
                selected
                  ? "border-emerald-950 bg-emerald-100 text-emerald-950"
                  : "border-slate-300 bg-white text-slate-900 hover:border-slate-600"
              }`}
            >
              <span className="text-sm font-black">{v.label}</span>
              <span className="text-[11px] font-bold text-slate-700">
                {real ? `${formatHora(real.inicio)} – ${formatHora(real.fin)}` : "ya pasó"}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

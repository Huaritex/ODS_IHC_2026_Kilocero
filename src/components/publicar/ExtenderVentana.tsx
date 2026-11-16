const EXTENSIONES = [
  { min: 0, label: "Sin cambios" },
  { min: 30, label: "+30 min" },
  { min: 60, label: "+1 hora" },
  { min: 120, label: "+2 horas" },
];

/** Opciones para alargar la hora límite de retiro de un aviso ya publicado. */
export function ExtenderVentana({
  value,
  onChange,
}: {
  value: number;
  onChange: (min: number) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-black uppercase tracking-wide text-slate-950">
        Extender hora de retiro
      </legend>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {EXTENSIONES.map((x) => (
          <button
            key={x.min}
            type="button"
            aria-pressed={value === x.min}
            onClick={() => onChange(x.min)}
            className={`min-h-[48px] rounded-xl border-2 px-2 text-sm font-extrabold ${
              value === x.min
                ? "border-emerald-950 bg-emerald-100 text-emerald-950"
                : "border-slate-300 bg-white text-slate-900 hover:border-slate-600"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

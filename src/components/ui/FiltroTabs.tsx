export function FiltroTabs<T extends string>({
  label,
  opciones,
  value,
  conteo,
  onChange,
}: {
  label: string;
  opciones: ReadonlyArray<readonly [T, string]>;
  value: T;
  conteo: Record<T, number>;
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0"
    >
      {opciones.map(([key, texto]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`min-h-[48px] shrink-0 rounded-xl border-2 px-4 text-sm font-extrabold ${
            value === key
              ? "border-slate-950 bg-slate-900 text-white"
              : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"
          }`}
        >
          {texto} ({conteo[key]})
        </button>
      ))}
    </div>
  );
}

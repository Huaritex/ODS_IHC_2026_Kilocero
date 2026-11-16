import { Search } from "lucide-react";
import { MERCADOS_SANTA_CRUZ } from "@/lib/constants";

/** Buscador por texto y selector de mercado del listado de locales. */
export function FiltrosLocales({
  busqueda,
  onBusqueda,
  mercado,
  onMercado,
}: {
  busqueda: string;
  onBusqueda: (v: string) => void;
  mercado: string;
  onMercado: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <label htmlFor="buscar-local" className="sr-only">
          Buscar por nombre, puesto o correo
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-600"
          aria-hidden="true"
        />
        <input
          id="buscar-local"
          type="search"
          value={busqueda}
          onChange={(e) => onBusqueda(e.target.value)}
          placeholder="Buscar nombre, puesto o correo"
          className="min-h-[48px] w-full rounded-xl border-2 border-slate-900 bg-white pr-3 pl-9 text-base text-slate-950"
        />
      </div>
      <label htmlFor="filtro-mercado-admin" className="sr-only">
        Filtrar por mercado
      </label>
      <select
        id="filtro-mercado-admin"
        value={mercado}
        onChange={(e) => onMercado(e.target.value)}
        className="min-h-[48px] rounded-xl border-2 border-slate-900 bg-white px-3 text-sm font-extrabold text-slate-950"
      >
        <option value="TODOS">Todos los mercados</option>
        {MERCADOS_SANTA_CRUZ.map((m) => (
          <option key={m.nombre} value={m.nombre}>
            {m.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}

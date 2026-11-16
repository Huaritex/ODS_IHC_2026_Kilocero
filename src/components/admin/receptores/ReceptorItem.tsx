import { EstadoVerificacionBadge } from "@/components/ui/EstadoBadge";
import type { ReceptorRow } from "../tipos";
import {
  ReceptorAcciones,
  ReceptorCheck,
  ReceptorContacto,
} from "./ReceptorParts";

export interface ReceptorItemProps {
  r: ReceptorRow;
  seleccionado: boolean;
  busy: boolean;
  onToggle: () => void;
  onAprobar: () => void;
  onEliminar: () => void;
  onRechazar: () => void;
}

const acciones = (p: ReceptorItemProps, full?: boolean) => (
  <ReceptorAcciones
    r={p.r}
    busy={p.busy}
    full={full}
    onAprobar={p.onAprobar}
    onEliminar={p.onEliminar}
    onRechazar={p.onRechazar}
  />
);

/** Vista móvil: tarjeta. */
export function ReceptorCard(p: ReceptorItemProps) {
  const { r } = p;
  return (
    <article className="space-y-3 rounded-2xl border-2 border-slate-900 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex">
          <ReceptorCheck r={r} checked={p.seleccionado} onToggle={p.onToggle} />
          <div>
            <h3 className="text-base font-black text-slate-950">
              {r.organizacion || "Sin organización"}
            </h3>
            <p className="text-xs font-semibold text-slate-700">{r.direccion}</p>
          </div>
        </div>
        <EstadoVerificacionBadge estado={r.estadoVerificacion} />
      </div>
      <div>
        <ReceptorContacto r={r} />
      </div>
      <div className="flex flex-wrap gap-2">{acciones(p, true)}</div>
    </article>
  );
}

/** Vista escritorio: fila de la tabla. */
export function ReceptorFila(p: ReceptorItemProps) {
  const { r } = p;
  return (
    <tr className="hover:bg-slate-50">
      <th scope="row" className="px-4 py-3 align-top font-normal">
        <div className="flex">
          <ReceptorCheck r={r} checked={p.seleccionado} onToggle={p.onToggle} />
          <div>
            <p className="font-extrabold text-slate-950">
              {r.organizacion || "Sin organización"}
            </p>
            <p className="text-xs text-slate-700">{r.direccion}</p>
          </div>
        </div>
      </th>
      <td className="px-4 py-3 align-top">
        <ReceptorContacto r={r} />
      </td>
      <td className="px-4 py-3 align-top">
        <EstadoVerificacionBadge estado={r.estadoVerificacion} />
      </td>
      <td className="px-4 py-3 text-right align-top">
        <div className="inline-flex flex-wrap justify-end gap-2">{acciones(p)}</div>
      </td>
    </tr>
  );
}

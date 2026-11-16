import { Check, Trash2, X } from "lucide-react";
import { BotonAccion } from "../BotonAccion";
import type { ReceptorRow } from "../tipos";

export const nombreReceptor = (r: ReceptorRow) => r.organizacion || r.nombre;

/** Casilla de selección por lote (los ya verificados no se pueden volver a aprobar). */
export function ReceptorCheck({
  r,
  checked,
  onToggle,
}: {
  r: ReceptorRow;
  checked: boolean;
  onToggle: () => void;
}) {
  if (r.estadoVerificacion === "VERIFICADO") return null;
  return (
    <input
      type="checkbox"
      className="mr-3 mt-0.5 h-6 w-6 shrink-0 accent-emerald-800"
      checked={checked}
      onChange={onToggle}
      aria-label={`Seleccionar a ${nombreReceptor(r)}`}
    />
  );
}

export function ReceptorContacto({ r }: { r: ReceptorRow }) {
  return (
    <>
      <p className="font-bold text-slate-950">{r.nombre}</p>
      <p className="text-xs text-slate-700">{r.email}</p>
      {r.telefono && <p className="text-xs text-slate-700">{r.telefono}</p>}
    </>
  );
}

/** Aprobar / eliminar / rechazar: se reutiliza en tarjeta móvil y fila de tabla. */
export function ReceptorAcciones({
  r,
  busy,
  full,
  onAprobar,
  onEliminar,
  onRechazar,
}: {
  r: ReceptorRow;
  busy: boolean;
  full?: boolean;
  onAprobar: () => void;
  onEliminar: () => void;
  onRechazar: () => void;
}) {
  const n = nombreReceptor(r);
  return (
    <>
      {r.estadoVerificacion !== "VERIFICADO" && (
        <BotonAccion
          icono={Check}
          variante="aprobar"
          full={full}
          disabled={busy}
          onClick={onAprobar}
          aria-label={`Aprobar a ${n}`}
        >
          Aprobar
        </BotonAccion>
      )}
      <BotonAccion
        icono={Trash2}
        variante="neutro"
        disabled={busy}
        onClick={onEliminar}
        aria-label={`Eliminar a ${n}`}
      >
        Eliminar
      </BotonAccion>
      {r.estadoVerificacion !== "RECHAZADO" && (
        <BotonAccion
          icono={X}
          variante="peligro"
          full={full}
          disabled={busy}
          onClick={onRechazar}
          aria-label={`Rechazar a ${n}`}
        >
          Rechazar
        </BotonAccion>
      )}
    </>
  );
}

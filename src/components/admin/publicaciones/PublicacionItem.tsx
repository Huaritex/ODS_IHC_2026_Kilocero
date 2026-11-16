import { CheckCircle2, EyeOff, Flag, RotateCcw, Trash2 } from "lucide-react";
import { CANTIDAD_MAP, CATEGORIA_MAP } from "@/lib/constants";
import { EstadoPublicacionBadge } from "@/components/ui/EstadoBadge";
import { BotonAccion } from "../BotonAccion";
import type { AdminPubRow } from "../tipos";

export interface PublicacionItemProps {
  p: AdminPubRow;
  busy: boolean;
  onOcultar: () => void;
  onRestaurar: () => void;
  onDescartar: () => void;
  onEliminar: () => void;
}

const destacada = (p: AdminPubRow) => p.reportada && !p.ocultaPorAdmin;

function EtiquetaOculta() {
  return (
    <span className="inline-block rounded border border-slate-800 bg-slate-200 px-2 py-0.5 text-xs font-extrabold text-slate-950">
      Oculta por Admin
    </span>
  );
}

function MotivoReporte({ p }: { p: AdminPubRow }) {
  if (!p.reportada) return null;
  return (
    <p className="flex items-start gap-1 text-xs font-extrabold text-rose-900">
      <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{p.motivoReporte || "Reportada"}</span>
    </p>
  );
}

function Acciones({ p, busy, full, ...h }: PublicacionItemProps & { full?: boolean }) {
  const resumen = `${CATEGORIA_MAP[p.categoria].label} de ${p.comerciante.nombre}`;
  return (
    <>
      {!p.ocultaPorAdmin ? (
        <BotonAccion
          icono={EyeOff}
          variante="peligro"
          full={full}
          disabled={busy}
          onClick={h.onOcultar}
          aria-label={`Ocultar publicación ${resumen}`}
        >
          Ocultar
        </BotonAccion>
      ) : (
        <BotonAccion
          icono={RotateCcw}
          variante="oscuro"
          full={full}
          disabled={busy}
          onClick={h.onRestaurar}
          aria-label={`Restaurar publicación ${resumen}`}
        >
          Restaurar
        </BotonAccion>
      )}
      {p.estado !== "CONFIRMADO" && p.estado !== "RETIRADO" && (
        <BotonAccion
          icono={Trash2}
          variante="neutro"
          disabled={busy}
          onClick={h.onEliminar}
          aria-label={`Eliminar publicación ${resumen}`}
        >
          Eliminar
        </BotonAccion>
      )}
      {destacada(p) && (
        <BotonAccion
          icono={CheckCircle2}
          variante="neutro"
          full={full}
          disabled={busy}
          onClick={h.onDescartar}
          aria-label={`Descartar reporte de ${resumen}`}
        >
          Descartar reporte
        </BotonAccion>
      )}
    </>
  );
}

const titulo = (p: AdminPubRow) => {
  const cat = CATEGORIA_MAP[p.categoria];
  return `${cat.emoji} ${cat.label} · ${CANTIDAD_MAP[p.cantidadAproximada].label}`;
};

/** Vista móvil: tarjeta. */
export function PublicacionCard(props: PublicacionItemProps) {
  const { p } = props;
  return (
    <article
      className={`space-y-3 rounded-2xl border-2 p-4 ${
        destacada(p) ? "border-rose-800 bg-rose-50" : "border-slate-900 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-black text-slate-950">{titulo(p)}</h3>
          <p className="text-xs font-bold text-slate-700">
            {p.comerciante.nombre} · {p.direccionTexto}
          </p>
        </div>
        <EstadoPublicacionBadge estado={p.estado} />
      </div>
      {p.ocultaPorAdmin && (
        <p>
          <EtiquetaOculta />
        </p>
      )}
      <MotivoReporte p={p} />
      <div className="flex flex-wrap gap-2">
        <Acciones {...props} full />
      </div>
    </article>
  );
}

/** Vista escritorio: fila de la tabla. */
export function PublicacionFila(props: PublicacionItemProps) {
  const { p } = props;
  return (
    <tr className={destacada(p) ? "bg-rose-50" : "hover:bg-slate-50"}>
      <th scope="row" className="px-4 py-3 align-top font-normal">
        <p className="font-extrabold text-slate-950">{titulo(p)}</p>
        {p.ocultaPorAdmin && (
          <p className="mt-1">
            <EtiquetaOculta />
          </p>
        )}
      </th>
      <td className="px-4 py-3 align-top">
        <p className="font-bold text-slate-950">{p.comerciante.nombre}</p>
        <p className="text-xs text-slate-700">{p.direccionTexto}</p>
      </td>
      <td className="space-y-1.5 px-4 py-3 align-top">
        <EstadoPublicacionBadge estado={p.estado} />
        <MotivoReporte p={p} />
      </td>
      <td className="px-4 py-3 text-right align-top">
        <div className="inline-flex flex-wrap justify-end gap-2">
          <Acciones {...props} />
        </div>
      </td>
    </tr>
  );
}

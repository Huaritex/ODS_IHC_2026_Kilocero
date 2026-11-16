import Link from "next/link";
import { Ban, Flag, UserCheck } from "lucide-react";
import { BotonAccion } from "../BotonAccion";
import type { LocalRow } from "../tipos";

export interface LocalItemProps {
  l: LocalRow;
  busy: boolean;
  onSuspender: () => void;
  onReactivar: () => void;
}

const fecha = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short" })
    : "Nunca";

function Suspendido() {
  return (
    <span className="inline-block rounded-full border-2 border-rose-700 bg-rose-100 px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-rose-950">
      Suspendido
    </span>
  );
}

function Estado({ l, busy, full, onSuspender, onReactivar }: LocalItemProps & { full?: boolean }) {
  const n = l.puesto || l.nombre;
  return l.suspendido ? (
    <BotonAccion icono={UserCheck} variante="aprobar" full={full} disabled={busy} onClick={onReactivar} aria-label={`Reactivar a ${n}`}>
      Reactivar
    </BotonAccion>
  ) : (
    <BotonAccion icono={Ban} variante="peligro" full={full} disabled={busy} onClick={onSuspender} aria-label={`Suspender a ${n}`}>
      Suspender
    </BotonAccion>
  );
}

function EnlaceReportes({ l, conTexto }: { l: LocalRow; conTexto?: boolean }) {
  return (
    <Link
      href="/admin/publicaciones?filtro=reportadas"
      className="inline-flex min-h-[48px] items-center gap-1 text-xs font-extrabold text-rose-900 underline underline-offset-4"
    >
      <Flag className="h-3.5 w-3.5" aria-hidden="true" />
      {l.reportadas}
      {conTexto && " reporte(s)"}
    </Link>
  );
}

function Contacto({ l }: { l: LocalRow }) {
  return (
    <>
      <p className="font-bold text-slate-950">{l.nombre}</p>
      <p className="text-xs text-slate-700">{l.email}</p>
      {l.telefono && <p className="text-xs text-slate-700">{l.telefono}</p>}
    </>
  );
}

/** Vista móvil: tarjeta con métricas del local. */
export function LocalCard(props: LocalItemProps) {
  const { l } = props;
  const metricas: [string, number][] = [
    ["Publicados", l.totalPublicaciones],
    ["Activos", l.activas],
    ["Entregas", l.entregasConfirmadas],
    ["Kg rescatados", l.kgRescatados],
  ];
  return (
    <article className="space-y-3 rounded-2xl border-2 border-slate-900 bg-white p-4">
      <div>
        <h3 className="text-base font-black text-slate-950">{l.puesto || "Sin puesto"}</h3>
        <p className="text-xs font-bold text-slate-700">{l.mercado || "Sin mercado"}</p>
        {l.suspendido && (
          <p className="mt-1">
            <Suspendido />
          </p>
        )}
        <div className="mt-1">
          <Contacto l={l} />
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-center">
        {metricas.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-slate-100 p-2">
            <dt className="text-[11px] font-extrabold uppercase text-slate-700">{k}</dt>
            <dd className="text-xl font-black text-slate-950">{v}</dd>
          </div>
        ))}
      </dl>
      <Estado {...props} full />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
        <span>Última publicación: {fecha(l.ultimaPublicacion)}</span>
        {l.reportadas > 0 && <EnlaceReportes l={l} conTexto />}
      </div>
    </article>
  );
}

/** Vista escritorio: fila de la tabla. */
export function LocalFila(props: LocalItemProps) {
  const { l } = props;
  const num = "px-4 py-3 text-right align-top font-bold";
  return (
    <tr className="hover:bg-slate-50">
      <th scope="row" className="px-4 py-3 align-top font-normal">
        <p className="font-extrabold text-slate-950">{l.puesto || "Sin puesto"}</p>
        <p className="text-xs text-slate-700">{l.mercado || "Sin mercado"}</p>
        <p className="text-xs text-slate-600">Última: {fecha(l.ultimaPublicacion)}</p>
        {l.suspendido && <Suspendido />}
      </th>
      <td className="px-4 py-3 align-top">
        <Contacto l={l} />
      </td>
      <td className={num}>{l.totalPublicaciones}</td>
      <td className={num}>{l.activas}</td>
      <td className={num}>{l.entregasConfirmadas}</td>
      <td className={num}>{l.kgRescatados}</td>
      <td className="px-4 py-3 align-top">
        {l.reportadas > 0 ? <EnlaceReportes l={l} /> : <span className="text-xs text-slate-600">—</span>}
      </td>
      <td className="px-4 py-3 text-right align-top">
        <Estado {...props} />
      </td>
    </tr>
  );
}

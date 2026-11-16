import { CheckCircle2, Clock, MapPin, XCircle } from "lucide-react";
import type { CantidadAproximada, CategoriaAlimento, EstadoPublicacion } from "@/lib/types";
import { CANTIDAD_MAP, CATEGORIA_MAP } from "@/lib/constants";
import { formatHora } from "@/lib/formato";
import { lugarPublicacion } from "@/lib/lugar";
import { EstadoPublicacionBadge } from "@/components/ui/EstadoBadge";
import { AccesosContacto } from "./AccesosContacto";

export interface ReservaItem {
  id: string;
  codigoRetiro: string | null;
  estado: "ACTIVA" | "COMPLETADA" | "CANCELADA" | "EXPIRADA";
  motivoCancelacion?: string | null;
  confirmadoReceptor: boolean;
  confirmadoComerciante: boolean;
  ventanaRetiroInicio: string;
  ventanaRetiroFin: string;
  publicacion: {
    id: string;
    categoria: CategoriaAlimento;
    cantidadAproximada: CantidadAproximada;
    mercado: string;
    direccionTexto: string;
    lat: number;
    lng: number;
    estado: EstadoPublicacion;
    comerciante: { nombre: string; puesto: string | null; telefono: string | null };
  };
}

export function ReservaCard({
  r,
  confirmando,
  onConfirmar,
  onCancelar,
}: {
  r: ReservaItem;
  confirmando: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const p = r.publicacion;
  const cat = CATEGORIA_MAP[p.categoria];
  const cant = CANTIDAD_MAP[p.cantidadAproximada];
  const activa = r.estado === "ACTIVA";

  return (
    <li className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-3xl" aria-hidden="true">
            {cat.emoji}
          </span>
          <div>
            <h3 className="text-lg font-black text-slate-950">
              {cat.label} · {cant.label}
            </h3>
            <p className="text-xs font-bold text-slate-700">{p.comerciante.nombre}</p>
          </div>
        </div>
        <EstadoPublicacionBadge estado={p.estado} />
      </div>

      {(r.estado === "CANCELADA" || r.estado === "EXPIRADA") && r.motivoCancelacion && (
        <p
          role="status"
          className="mt-3 rounded-xl border-2 border-rose-800 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-950"
        >
          Reserva {r.estado === "CANCELADA" ? "cancelada" : "vencida"}: {r.motivoCancelacion}
        </p>
      )}

      {r.codigoRetiro && activa && (
        <div className="mt-3 rounded-xl border-2 border-slate-900 bg-amber-100 px-3 py-2 text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">
            Mostrale este código al comerciante
          </p>
          <p className="text-xl font-black tracking-widest text-slate-950">{r.codigoRetiro}</p>
        </div>
      )}

      <div className="mt-3 space-y-1 text-sm font-bold text-slate-800">
        <p className="flex items-center gap-1.5 text-slate-950">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{lugarPublicacion(p)}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Retiro: {formatHora(r.ventanaRetiroInicio)} – {formatHora(r.ventanaRetiroFin)}
          </span>
        </p>
      </div>

      <p className="mt-2 text-xs font-extrabold text-slate-700">
        {r.confirmadoReceptor
          ? "✓ Vos confirmaste el retiro"
          : "◷ Confirmá al recibir los alimentos en el puesto"}
        {" · "}
        {r.confirmadoComerciante
          ? "✓ Comerciante confirmó"
          : "◷ Falta confirmación del comerciante"}
      </p>

      {activa && (
        <div className="mt-3">
          <AccesosContacto lat={p.lat} lng={p.lng} telefono={p.comerciante.telefono} />
        </div>
      )}

      {activa && !r.confirmadoReceptor && (
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            disabled={confirmando}
            onClick={onConfirmar}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 text-base font-extrabold text-white hover:bg-emerald-900 disabled:opacity-60"
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <span>{confirmando ? "Confirmando..." : "Confirmar que ya retiré"}</span>
          </button>
          <button
            type="button"
            onClick={onCancelar}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-rose-800 bg-white px-4 text-sm font-extrabold text-rose-900 hover:bg-rose-50"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            <span>Cancelar reserva</span>
          </button>
        </div>
      )}
    </li>
  );
}

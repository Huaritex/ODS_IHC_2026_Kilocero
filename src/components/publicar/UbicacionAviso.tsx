"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, MapPin } from "lucide-react";
import { MERCADOS_SANTA_CRUZ } from "@/lib/constants";

/** Resumen fijo de dónde y cuándo se retira; permite cambiar mercado y puesto. */
export function UbicacionAviso({
  mercado,
  direccionTexto,
  ventanaActual,
  onMercado,
  onDireccion,
}: {
  mercado: string;
  direccionTexto: string;
  ventanaActual: string;
  onMercado: (nombre: string) => void;
  onDireccion: (texto: string) => void;
}) {
  const [mostrarPuesto, setMostrarPuesto] = useState(false);

  return (
    <div className="rounded-2xl border-2 border-slate-900 bg-white p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 text-xs font-bold text-slate-800">
          <p className="flex items-center gap-1.5 text-slate-950">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{direccionTexto}</span>
          </p>
          <p className="flex items-center gap-1.5 text-emerald-900">
            <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Retiro hoy: {ventanaActual}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMostrarPuesto((v) => !v)}
          className="flex min-h-[48px] shrink-0 items-center gap-1 rounded-xl border-2 border-slate-800 bg-slate-100 px-3 text-xs font-extrabold text-slate-950"
        >
          <span>Cambiar</span>
          {mostrarPuesto ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {mostrarPuesto && (
        <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
          <div>
            <label
              htmlFor="pub-mercado"
              className="block text-xs font-extrabold uppercase text-slate-700"
            >
              Mercado
            </label>
            <select
              id="pub-mercado"
              value={mercado}
              onChange={(e) => onMercado(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 bg-white px-3 text-sm font-bold"
            >
              {MERCADOS_SANTA_CRUZ.map((m) => (
                <option key={m.nombre} value={m.nombre}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="pub-dir"
              className="block text-xs font-extrabold uppercase text-slate-700"
            >
              Puesto o pasillo
            </label>
            <input
              id="pub-dir"
              value={direccionTexto}
              onChange={(e) => onDireccion(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 px-3 text-base"
            />
          </div>
        </div>
      )}
    </div>
  );
}

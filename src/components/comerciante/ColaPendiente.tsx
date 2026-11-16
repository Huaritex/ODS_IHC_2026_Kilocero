"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { CANTIDAD_MAP, CATEGORIA_MAP } from "@/lib/constants";
import {
  removeQueuedPublicacion,
  type QueuedComercianteAction,
  type QueuedPublicacion,
} from "@/lib/offline-queue";

/** Operaciones guardadas localmente por falta de señal, a la espera de envío. */
export function ColaPendiente({
  total,
  cola,
  acciones,
  onRetry,
}: {
  total: number;
  cola: QueuedPublicacion[];
  acciones: QueuedComercianteAction[];
  onRetry: () => void;
}) {
  return (
    <section
      aria-label="Operaciones pendientes de envío"
      className="rounded-2xl border-2 border-amber-700 bg-amber-50 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-950">
          <CloudOff className="h-5 w-5 shrink-0" aria-hidden="true" />
          <h2 className="text-base font-black">
            Pendiente de envío ({total})
          </h2>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="flex min-h-[48px] items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-white px-3 text-sm font-extrabold text-slate-950 hover:bg-slate-100"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          <span>Reintentar</span>
        </button>
      </div>
      <p className="mt-1 text-sm font-medium text-amber-950">
        Se enviarán automáticamente cuando vuelva la conexión.
      </p>
      <ul className="mt-3 space-y-2">
        {cola.map((item) => {
          const cat = CATEGORIA_MAP[item.categoria];
          const cant = CANTIDAD_MAP[item.cantidadAproximada];
          return (
            <li
              key={item.localId}
              className="flex items-center justify-between gap-2 rounded-xl border border-amber-700 bg-white p-3"
            >
              <div>
                <p className="text-sm font-extrabold text-slate-950">
                  {cat.emoji} {cat.label} · {cant.label}
                </p>
                <p className="text-xs font-semibold text-amber-900">
                  ◷ Pendiente de envío · {item.direccionTexto}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeQueuedPublicacion(item.localId)}
                className="min-h-[48px] rounded-lg px-3 text-xs font-bold text-rose-800 underline"
              >
                Descartar
              </button>
            </li>
          );
        })}
        {acciones.map((act) => (
          <li
            key={act.localId}
            className="rounded-xl border border-amber-700 bg-white p-3"
          >
            <p className="text-sm font-extrabold text-slate-950">
              {act.label}
            </p>
            <p className="text-xs font-semibold text-amber-900">
              ◷ Pendiente de sincronizar al volver la señal
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

interface Registro {
  id: string;
  adminNombre: string;
  accion: string;
  entidad: string;
  entidadId: string;
  detalle: string | null;
  createdAt: string;
}

const ETIQUETAS: Record<string, string> = {
  RECEPTOR_VERIFICADO: "Receptor aprobado",
  RECEPTOR_RECHAZADO: "Receptor rechazado",
  PUBLICACION_OCULTADA: "Publicación ocultada",
  PUBLICACION_RESTAURADA: "Publicación restaurada",
  REPORTE_DESCARTADO: "Reporte descartado",
  LOCAL_SUSPENDIDO: "Local suspendido",
  LOCAL_REACTIVADO: "Local reactivado",
};

function cuando(iso: string) {
  return new Date(iso).toLocaleString("es-BO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAuditoriaPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/auditoria", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRegistros(data.registros || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-slate-950">
          Historial de acciones
        </h2>
        <p className="text-sm font-semibold text-slate-700">
          Quién aprobó, rechazó, ocultó o suspendió, y cuándo (últimas 200).
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-rose-800 bg-rose-50 p-4 text-sm font-bold text-rose-950"
        >
          <span>No se pudo cargar el historial.</span>
          <button
            type="button"
            onClick={cargar}
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border-2 border-rose-800 bg-white px-4 text-sm font-extrabold"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 text-center font-bold">
          Cargando historial...
        </div>
      ) : registros.length === 0 && !error ? (
        <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 text-center font-bold">
          Todavía no hay acciones registradas.
        </div>
      ) : (
        <ol className="space-y-2">
          {registros.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border-2 border-slate-900 bg-white p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-black text-slate-950">
                  {ETIQUETAS[r.accion] ?? r.accion}
                </p>
                <time
                  dateTime={r.createdAt}
                  className="text-xs font-bold text-slate-700"
                >
                  {cuando(r.createdAt)}
                </time>
              </div>
              {r.detalle && (
                <p className="mt-1 break-words text-sm text-slate-800">
                  {r.detalle}
                </p>
              )}
              <p className="mt-1 text-xs font-semibold text-slate-600">
                Por {r.adminNombre}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

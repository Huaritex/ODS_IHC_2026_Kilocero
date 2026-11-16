"use client";

import React, { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { ErrorReintentar } from "@/components/ui/ErrorReintentar";

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
  PUBLICACION_ELIMINADA: "Publicación eliminada",
  RECEPTOR_ELIMINADO: "Receptor eliminado",
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
    const r = await api<{ registros: Registro[] }>("/api/admin/auditoria");
    if (r.ok && r.data) setRegistros(r.data.registros || []);
    else setError(true);
    setLoading(false);
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
        <ErrorReintentar mensaje="No se pudo cargar el historial." onRetry={cargar} />
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

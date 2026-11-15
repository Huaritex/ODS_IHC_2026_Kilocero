"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { EstadoVerificacion } from "@/lib/types";
import { EstadoVerificacionBadge } from "@/components/ui/EstadoBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ToastProvider";

interface ReceptorRow {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  organizacion: string | null;
  direccion: string | null;
  estadoVerificacion: EstadoVerificacion;
  motivoRechazo: string | null;
}

export default function AdminReceptoresPage() {
  const { notify } = useToast();
  const [receptores, setReceptores] = useState<ReceptorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ReceptorRow | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/receptores", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setReceptores(data.receptores || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function decidir(id: string, decision: "VERIFICADO" | "RECHAZADO") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/receptores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          motivoRechazo:
            decision === "RECHAZADO"
              ? "Documentación o datos de contacto no verificables"
              : undefined,
        }),
      });
      if (!res.ok) {
        notify("No se pudo actualizar el estado.", "error");
        return;
      }
      notify(
        decision === "VERIFICADO"
          ? "Receptor aprobado. Ya puede reservar."
          : "Solicitud rechazada.",
        decision === "VERIFICADO" ? "success" : "info"
      );
      setRejectTarget(null);
      await cargar();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-slate-950">
          Verificación de receptores
        </h2>
        <p className="text-sm font-semibold text-slate-700">
          Aprobá o rechazá comedores, hogares y ONGs antes de que reserven.
        </p>
      </div>

      {/* Vista móvil en tarjetas */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 text-center font-bold">
            Cargando receptores...
          </div>
        ) : receptores.length === 0 ? (
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 text-center font-bold">
            No hay receptores registrados.
          </div>
        ) : (
          receptores.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border-2 border-slate-900 bg-white p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-950">
                    {r.organizacion || "Sin organización"}
                  </h3>
                  <p className="text-xs font-semibold text-slate-700">
                    {r.direccion}
                  </p>
                </div>
                <EstadoVerificacionBadge estado={r.estadoVerificacion} />
              </div>
              <div className="text-xs text-slate-800">
                <p className="font-bold">{r.nombre}</p>
                <p>{r.email}</p>
                {r.telefono && <p>{r.telefono}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {r.estadoVerificacion !== "VERIFICADO" && (
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => decidir(r.id, "VERIFICADO")}
                    aria-label={`Aprobar a ${r.organizacion || r.nombre}`}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-800 px-3 text-xs font-extrabold text-white hover:bg-emerald-900 disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>Aprobar</span>
                  </button>
                )}
                {r.estadoVerificacion !== "RECHAZADO" && (
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => setRejectTarget(r)}
                    aria-label={`Rechazar a ${r.organizacion || r.nombre}`}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-rose-800 bg-white px-3 text-xs font-extrabold text-rose-900 hover:bg-rose-50 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span>Rechazar</span>
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {/* Vista escritorio en tabla accesible */}
      <div className="hidden overflow-x-auto rounded-2xl border-2 border-slate-900 bg-white md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Lista de organizaciones receptoras y su estado de verificación
          </caption>
          <thead className="border-b-2 border-slate-900 bg-slate-100 text-xs font-black uppercase text-slate-950">
            <tr>
              <th scope="col" className="px-4 py-3">
                Organización
              </th>
              <th scope="col" className="px-4 py-3">
                Responsable / Contacto
              </th>
              <th scope="col" className="px-4 py-3">
                Estado
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center font-bold">
                  Cargando receptores...
                </td>
              </tr>
            ) : receptores.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center font-bold">
                  No hay receptores registrados.
                </td>
              </tr>
            ) : (
              receptores.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <th scope="row" className="px-4 py-3 align-top font-normal">
                    <p className="font-extrabold text-slate-950">
                      {r.organizacion || "Sin organización"}
                    </p>
                    <p className="text-xs text-slate-700">{r.direccion}</p>
                  </th>
                  <td className="px-4 py-3 align-top">
                    <p className="font-bold text-slate-950">{r.nombre}</p>
                    <p className="text-xs text-slate-700">{r.email}</p>
                    {r.telefono && (
                      <p className="text-xs text-slate-700">{r.telefono}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <EstadoVerificacionBadge estado={r.estadoVerificacion} />
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <div className="inline-flex flex-wrap justify-end gap-2">
                      {r.estadoVerificacion !== "VERIFICADO" && (
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => decidir(r.id, "VERIFICADO")}
                          aria-label={`Aprobar a ${r.organizacion || r.nombre}`}
                          className="inline-flex min-h-[48px] items-center gap-1 rounded-xl bg-emerald-800 px-3.5 text-xs font-extrabold text-white hover:bg-emerald-900 disabled:opacity-60"
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                          <span>Aprobar</span>
                        </button>
                      )}
                      {r.estadoVerificacion !== "RECHAZADO" && (
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          onClick={() => setRejectTarget(r)}
                          aria-label={`Rechazar a ${r.organizacion || r.nombre}`}
                          className="inline-flex min-h-[48px] items-center gap-1 rounded-xl border-2 border-rose-800 bg-white px-3.5 text-xs font-extrabold text-rose-900 hover:bg-rose-50 disabled:opacity-60"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                          <span>Rechazar</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={Boolean(rejectTarget)}
        title="¿Rechazar solicitud?"
        description={`Vas a rechazar a ${rejectTarget?.organizacion || rejectTarget?.nombre}. No podrá reservar excedentes mientras esté rechazada.`}
        confirmLabel="Sí, rechazar"
        loading={Boolean(busyId)}
        onConfirm={() =>
          rejectTarget && decidir(rejectTarget.id, "RECHAZADO")
        }
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}

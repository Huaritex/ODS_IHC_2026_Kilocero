"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, X, RefreshCw, CheckCheck, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
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
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [batchOpen, setBatchOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReceptorRow | null>(null);
  const [filtro, setFiltro] = useState<"PENDIENTE" | "VERIFICADO" | "RECHAZADO" | "TODOS">("PENDIENTE");

  const cargar = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/admin/receptores", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReceptores(data.receptores || []);
    } catch {
      setError(true);
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
              ? motivo.trim() ||
                "Documentación o datos de contacto no verificables"
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
      setMotivo("");
      await cargar();
    } finally {
      setBusyId(null);
    }
  }

  async function eliminar(r: ReceptorRow) {
    setBusyId(r.id);
    const res = await api(`/api/admin/receptores/${r.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      notify(res.error ?? "No se pudo eliminar.", "error");
      setDeleteTarget(null);
      return;
    }
    notify("Receptor eliminado.", "info");
    setDeleteTarget(null);
    await cargar();
  }

  function toggleSel(id: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function aprobarLote() {
    setBusyId("lote");
    try {
      const res = await fetch("/api/admin/receptores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(sel) }),
      });
      if (!res.ok) {
        notify("No se pudo aprobar la selección.", "error");
        return;
      }
      const data = await res.json();
      notify(`${data.aprobados} receptor(es) aprobado(s).`, "success");
      setSel(new Set());
      setBatchOpen(false);
      await cargar();
    } finally {
      setBusyId(null);
    }
  }

  const conteo = useMemo(
    () => ({
      PENDIENTE: receptores.filter((r) => r.estadoVerificacion === "PENDIENTE").length,
      VERIFICADO: receptores.filter((r) => r.estadoVerificacion === "VERIFICADO").length,
      RECHAZADO: receptores.filter((r) => r.estadoVerificacion === "RECHAZADO").length,
      TODOS: receptores.length,
    }),
    [receptores]
  );
  const visibles = useMemo(
    () =>
      filtro === "TODOS"
        ? receptores
        : receptores.filter((r) => r.estadoVerificacion === filtro),
    [receptores, filtro]
  );
  const aprobables = visibles.filter((r) => r.estadoVerificacion !== "VERIFICADO");
  const selVisibles = aprobables.filter((r) => sel.has(r.id));

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

      <div
        role="group"
        aria-label="Filtrar por estado"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0"
      >
        {(
          [
            ["PENDIENTE", "Pendientes"],
            ["VERIFICADO", "Verificados"],
            ["RECHAZADO", "Rechazados"],
            ["TODOS", "Todos"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filtro === key}
            onClick={() => setFiltro(key)}
            className={`min-h-[48px] shrink-0 rounded-xl border-2 px-4 text-sm font-extrabold ${
              filtro === key
                ? "border-slate-950 bg-slate-900 text-white"
                : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"
            }`}
          >
            {label} ({conteo[key]})
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-rose-800 bg-rose-50 p-4 text-sm font-bold text-rose-950"
        >
          <span>No se pudo cargar el listado.</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              cargar();
            }}
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border-2 border-rose-800 bg-white px-4 text-sm font-extrabold"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      )}

      {aprobables.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-slate-900 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-h-[48px] cursor-pointer items-center gap-3 text-sm font-extrabold text-slate-950">
            <input
              type="checkbox"
              className="h-6 w-6 accent-emerald-800"
              checked={selVisibles.length === aprobables.length}
              onChange={(e) =>
                setSel(
                  e.target.checked
                    ? new Set(aprobables.map((r) => r.id))
                    : new Set()
                )
              }
            />
            Seleccionar todos ({aprobables.length})
          </label>
          <button
            type="button"
            disabled={selVisibles.length === 0 || busyId === "lote"}
            onClick={() => setBatchOpen(true)}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-extrabold text-white hover:bg-emerald-900 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Aprobar seleccionados ({selVisibles.length})
          </button>
        </div>
      )}

      {/* Vista móvil en tarjetas */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 text-center font-bold">
            Cargando receptores...
          </div>
        ) : visibles.length === 0 ? (
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 text-center font-bold">
            No hay receptores en este estado.
          </div>
        ) : (
          visibles.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border-2 border-slate-900 bg-white p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex">
                  {r.estadoVerificacion !== "VERIFICADO" && (<input
                    type="checkbox"
                    className="mr-3 mt-0.5 h-6 w-6 shrink-0 accent-emerald-800"
                    checked={sel.has(r.id)}
                    onChange={() => toggleSel(r.id)}
                    aria-label={`Seleccionar a ${r.organizacion || r.nombre}`}
                  />)}
                  <div>
                  <h3 className="text-base font-black text-slate-950">
                    {r.organizacion || "Sin organización"}
                  </h3>
                  <p className="text-xs font-semibold text-slate-700">
                    {r.direccion}
                  </p>
                  </div>
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
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => setDeleteTarget(r)}
                  aria-label={`Eliminar a ${r.organizacion || r.nombre}`}
                  className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border-2 border-slate-800 bg-white px-3 text-xs font-extrabold text-slate-950 hover:bg-slate-100 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span>Eliminar</span>
                </button>
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
            ) : visibles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center font-bold">
                  No hay receptores en este estado.
                </td>
              </tr>
            ) : (
              visibles.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <th scope="row" className="px-4 py-3 align-top font-normal">
                    <div className="flex">
                      {r.estadoVerificacion !== "VERIFICADO" && (<input
                    type="checkbox"
                    className="mr-3 mt-0.5 h-6 w-6 shrink-0 accent-emerald-800"
                    checked={sel.has(r.id)}
                    onChange={() => toggleSel(r.id)}
                    aria-label={`Seleccionar a ${r.organizacion || r.nombre}`}
                  />)}
                      <div>
                        <p className="font-extrabold text-slate-950">
                          {r.organizacion || "Sin organización"}
                        </p>
                        <p className="text-xs text-slate-700">{r.direccion}</p>
                      </div>
                    </div>
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
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => setDeleteTarget(r)}
                        aria-label={`Eliminar a ${r.organizacion || r.nombre}`}
                        className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border-2 border-slate-800 bg-white px-3 text-xs font-extrabold text-slate-950 hover:bg-slate-100 disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span>Eliminar</span>
                      </button>
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
        onCancel={() => {
          setRejectTarget(null);
          setMotivo("");
        }}
      >
        <label
          htmlFor="motivo-rechazo"
          className="mt-4 block text-sm font-extrabold text-slate-950"
        >
          Motivo (lo verá el receptor)
        </label>
        <textarea
          id="motivo-rechazo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="Ej. No pudimos verificar el teléfono de contacto"
          className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-base text-slate-950"
        />
      </ConfirmModal>

      <ConfirmModal
        open={batchOpen}
        title="¿Aprobar seleccionados?"
        description={`Se aprobarán ${selVisibles.length} receptor(es) y podrán reservar excedentes de inmediato.`}
        confirmLabel="Sí, aprobar"
        destructive={false}
        loading={busyId === "lote"}
        onConfirm={aprobarLote}
        onCancel={() => setBatchOpen(false)}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="¿Eliminar este receptor?"
        description={`Se borra la cuenta de ${deleteTarget?.organizacion || deleteTarget?.nombre}. Si tiene entregas o reservas activas no se podrá eliminar: en ese caso rechazalo.`}
        confirmLabel="Sí, eliminar"
        loading={Boolean(busyId)}
        onConfirm={() => deleteTarget && eliminar(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

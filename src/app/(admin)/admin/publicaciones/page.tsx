"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EyeOff, RotateCcw, Flag, CheckCircle2, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import type {
  CantidadAproximada,
  CategoriaAlimento,
  EstadoPublicacion,
} from "@/lib/types";
import { CANTIDAD_MAP, CATEGORIA_MAP } from "@/lib/constants";
import { EstadoPublicacionBadge } from "@/components/ui/EstadoBadge";
import { FiltroTabs } from "@/components/ui/FiltroTabs";
import { ErrorReintentar } from "@/components/ui/ErrorReintentar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ToastProvider";

interface AdminPubRow {
  id: string;
  categoria: CategoriaAlimento;
  cantidadAproximada: CantidadAproximada;
  mercado: string;
  direccionTexto: string;
  estado: EstadoPublicacion;
  reportada: boolean;
  motivoReporte: string | null;
  ocultaPorAdmin: boolean;
  comerciante: {
    nombre: string;
  };
}

export default function AdminPublicacionesPage() {
  const { notify } = useToast();
  const [publicaciones, setPublicaciones] = useState<AdminPubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hideTarget, setHideTarget] = useState<AdminPubRow | null>(null);
  const [error, setError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminPubRow | null>(null);
  const [filtro, setFiltro] = useState<"REPORTADAS" | "OCULTAS" | "TODAS">("TODAS");

  const cargar = useCallback(async () => {
    setError(false);
    const r = await api<{ publicaciones: AdminPubRow[] }>("/api/admin/publicaciones");
    if (r.ok && r.data) setPublicaciones(r.data.publicaciones || []);
    else setError(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
    const q = new URLSearchParams(window.location.search).get("filtro");
    if (q === "reportadas") setFiltro("REPORTADAS");
    if (q === "ocultas") setFiltro("OCULTAS");
  }, [cargar]);

  const conteo = useMemo(
    () => ({
      REPORTADAS: publicaciones.filter((p) => p.reportada && !p.ocultaPorAdmin).length,
      OCULTAS: publicaciones.filter((p) => p.ocultaPorAdmin).length,
      TODAS: publicaciones.length,
    }),
    [publicaciones]
  );
  const visibles = useMemo(() => {
    if (filtro === "REPORTADAS")
      return publicaciones.filter((p) => p.reportada && !p.ocultaPorAdmin);
    if (filtro === "OCULTAS") return publicaciones.filter((p) => p.ocultaPorAdmin);
    return publicaciones;
  }, [publicaciones, filtro]);

  async function eliminar(p: AdminPubRow) {
    setBusyId(p.id);
    const r = await api(`/api/admin/publicaciones/${p.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!r.ok) {
      notify(r.error ?? "No se pudo eliminar.", "error");
      return;
    }
    notify("Publicación eliminada.", "info");
    setDeleteTarget(null);
    await cargar();
  }

  async function moderar(
    id: string,
    accion: "OCULTAR" | "RESTAURAR" | "DESCARTAR_REPORTE"
  ) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/publicaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      if (!res.ok) {
        notify("No se pudo moderar la publicación.", "error");
        return;
      }
      notify(
        accion === "OCULTAR"
          ? "Publicación ocultada por moderación."
          : "Publicación actualizada.",
        "info"
      );
      setHideTarget(null);
      await cargar();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-slate-950">
          Moderación de publicaciones
        </h2>
        <p className="text-sm font-semibold text-slate-700">
          Las publicaciones reportadas aparecen primero para revisión rápida.
        </p>
      </div>

      <FiltroTabs
        label="Filtrar publicaciones"
        opciones={
          [
            ["REPORTADAS", "Reportadas"],
            ["OCULTAS", "Ocultas"],
            ["TODAS", "Todas"],
          ] as const
        }
        value={filtro}
        conteo={conteo}
        onChange={setFiltro}
      />

      {error && (
        <ErrorReintentar
          mensaje="No se pudo cargar el listado."
          onRetry={() => {
            setLoading(true);
            cargar();
          }}
        />
      )}

      {/* Vista móvil en tarjetas */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 text-center font-bold">
            Cargando publicaciones...
          </div>
        ) : visibles.length === 0 ? (
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 text-center font-bold">
            No hay publicaciones en esta vista.
          </div>
        ) : (
          visibles.map((p) => {
            const cat = CATEGORIA_MAP[p.categoria];
            const cant = CANTIDAD_MAP[p.cantidadAproximada];
            const labelResumen = `${cat.label} de ${p.comerciante.nombre}`;
            return (
              <article
                key={p.id}
                className={`rounded-2xl border-2 p-4 space-y-3 ${
                  p.reportada && !p.ocultaPorAdmin
                    ? "border-rose-800 bg-rose-50"
                    : "border-slate-900 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-950">
                      {cat.emoji} {cat.label} · {cant.label}
                    </h3>
                    <p className="text-xs font-bold text-slate-700">
                      {p.comerciante.nombre} · {p.direccionTexto}
                    </p>
                  </div>
                  <EstadoPublicacionBadge estado={p.estado} />
                </div>

                {p.ocultaPorAdmin && (
                  <span className="inline-block rounded border border-slate-800 bg-slate-200 px-2 py-0.5 text-xs font-extrabold text-slate-950">
                    Oculta por Admin
                  </span>
                )}

                {p.reportada && (
                  <p className="flex items-start gap-1 text-xs font-extrabold text-rose-900">
                    <Flag
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{p.motivoReporte || "Reportada"}</span>
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {!p.ocultaPorAdmin ? (
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => setHideTarget(p)}
                      aria-label={`Ocultar publicación ${labelResumen}`}
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1 rounded-xl border-2 border-rose-800 bg-white px-3 text-xs font-extrabold text-rose-900 hover:bg-rose-50"
                    >
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                      <span>Ocultar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => moderar(p.id, "RESTAURAR")}
                      aria-label={`Restaurar publicación ${labelResumen}`}
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1 rounded-xl bg-slate-900 px-3 text-xs font-extrabold text-white hover:bg-slate-800"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      <span>Restaurar</span>
                    </button>
                  )}
                  {p.estado !== "CONFIRMADO" && p.estado !== "RETIRADO" && (
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => setDeleteTarget(p)}
                      aria-label={`Eliminar publicación ${labelResumen}`}
                      className="inline-flex min-h-[48px] items-center justify-center gap-1 rounded-xl border-2 border-slate-800 bg-white px-3 text-xs font-extrabold text-slate-950 hover:bg-slate-100"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span>Eliminar</span>
                    </button>
                  )}
                  {p.reportada && !p.ocultaPorAdmin && (
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => moderar(p.id, "DESCARTAR_REPORTE")}
                      aria-label={`Descartar reporte de ${labelResumen}`}
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1 rounded-xl border-2 border-slate-800 bg-white px-3 text-xs font-extrabold text-slate-950 hover:bg-slate-100"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>Descartar reporte</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Vista escritorio en tabla accesible */}
      <div className="hidden overflow-x-auto rounded-2xl border-2 border-slate-900 bg-white md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Listado de publicaciones de excedentes y estado de moderación
          </caption>
          <thead className="border-b-2 border-slate-900 bg-slate-100 text-xs font-black uppercase text-slate-950">
            <tr>
              <th scope="col" className="px-4 py-3">
                Excedente
              </th>
              <th scope="col" className="px-4 py-3">
                Comerciante / Lugar
              </th>
              <th scope="col" className="px-4 py-3">
                Estado / Reporte
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
                  Cargando publicaciones...
                </td>
              </tr>
            ) : visibles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center font-bold">
                  No hay publicaciones en esta vista.
                </td>
              </tr>
            ) : (
              visibles.map((p) => {
                const cat = CATEGORIA_MAP[p.categoria];
                const cant = CANTIDAD_MAP[p.cantidadAproximada];
                const labelResumen = `${cat.label} de ${p.comerciante.nombre}`;
                return (
                  <tr
                    key={p.id}
                    className={
                      p.reportada && !p.ocultaPorAdmin
                        ? "bg-rose-50"
                        : "hover:bg-slate-50"
                    }
                  >
                    <th scope="row" className="px-4 py-3 align-top font-normal">
                      <p className="font-extrabold text-slate-950">
                        {cat.emoji} {cat.label} · {cant.label}
                      </p>
                      {p.ocultaPorAdmin && (
                        <span className="mt-1 inline-block rounded border border-slate-800 bg-slate-200 px-2 py-0.5 text-xs font-extrabold text-slate-950">
                          Oculta por Admin
                        </span>
                      )}
                    </th>
                    <td className="px-4 py-3 align-top">
                      <p className="font-bold text-slate-950">
                        {p.comerciante.nombre}
                      </p>
                      <p className="text-xs text-slate-700">
                        {p.direccionTexto}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top space-y-1.5">
                      <EstadoPublicacionBadge estado={p.estado} />
                      {p.reportada && (
                        <p className="flex items-start gap-1 text-xs font-extrabold text-rose-900">
                          <Flag
                            className="mt-0.5 h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{p.motivoReporte || "Reportada"}</span>
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        {!p.ocultaPorAdmin ? (
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => setHideTarget(p)}
                            aria-label={`Ocultar publicación ${labelResumen}`}
                            className="inline-flex min-h-[48px] items-center gap-1 rounded-xl border-2 border-rose-800 bg-white px-3.5 text-xs font-extrabold text-rose-900 hover:bg-rose-50"
                          >
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                            <span>Ocultar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => moderar(p.id, "RESTAURAR")}
                            aria-label={`Restaurar publicación ${labelResumen}`}
                            className="inline-flex min-h-[48px] items-center gap-1 rounded-xl bg-slate-900 px-3.5 text-xs font-extrabold text-white hover:bg-slate-800"
                          >
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            <span>Restaurar</span>
                          </button>
                        )}
                        {p.estado !== "CONFIRMADO" && p.estado !== "RETIRADO" && (
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => setDeleteTarget(p)}
                            aria-label={`Eliminar publicación ${labelResumen}`}
                            className="inline-flex min-h-[48px] items-center justify-center gap-1 rounded-xl border-2 border-slate-800 bg-white px-3 text-xs font-extrabold text-slate-950 hover:bg-slate-100"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            <span>Eliminar</span>
                          </button>
                        )}
                        {p.reportada && !p.ocultaPorAdmin && (
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => moderar(p.id, "DESCARTAR_REPORTE")}
                            aria-label={`Descartar reporte de ${labelResumen}`}
                            className="inline-flex min-h-[48px] items-center gap-1 rounded-xl border-2 border-slate-800 bg-white px-3.5 text-xs font-extrabold text-slate-950 hover:bg-slate-100"
                          >
                            <CheckCircle2
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            <span>Descartar reporte</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={Boolean(hideTarget)}
        title="¿Ocultar esta publicación?"
        description="Dejará de mostrarse a los comedores y receptores."
        confirmLabel="Sí, ocultar"
        loading={Boolean(busyId)}
        onConfirm={() => hideTarget && moderar(hideTarget.id, "OCULTAR")}
        onCancel={() => setHideTarget(null)}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="¿Eliminar definitivamente?"
        description="Se borra la publicación y se cancelan sus reservas activas. Queda registrado en la auditoría."
        confirmLabel="Sí, eliminar"
        loading={Boolean(busyId)}
        onConfirm={() => deleteTarget && eliminar(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

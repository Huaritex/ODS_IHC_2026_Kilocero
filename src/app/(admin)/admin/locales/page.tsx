"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ban, Flag, RefreshCw, Search, UserCheck } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ToastProvider";
import { MERCADOS_SANTA_CRUZ } from "@/lib/constants";

interface LocalRow {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  mercado: string | null;
  puesto: string | null;
  suspendido: boolean;
  motivoSuspension: string | null;
  createdAt: string;
  totalPublicaciones: number;
  activas: number;
  entregasConfirmadas: number;
  kgRescatados: number;
  reportadas: number;
  ultimaPublicacion: string | null;
}

function fecha(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "short",
      })
    : "Nunca";
}

function BotonEstado({
  l,
  busy,
  onSuspender,
  onReactivar,
  full,
}: {
  l: LocalRow;
  busy: boolean;
  onSuspender: () => void;
  onReactivar: () => void;
  full?: boolean;
}) {
  const base = `inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs font-extrabold disabled:opacity-60 ${
    full ? "w-full" : ""
  }`;
  return l.suspendido ? (
    <button
      type="button"
      disabled={busy}
      onClick={onReactivar}
      aria-label={`Reactivar a ${l.puesto || l.nombre}`}
      className={`${base} bg-emerald-800 text-white hover:bg-emerald-900`}
    >
      <UserCheck className="h-4 w-4" aria-hidden="true" />
      Reactivar
    </button>
  ) : (
    <button
      type="button"
      disabled={busy}
      onClick={onSuspender}
      aria-label={`Suspender a ${l.puesto || l.nombre}`}
      className={`${base} border-2 border-rose-800 bg-white text-rose-900 hover:bg-rose-50`}
    >
      <Ban className="h-4 w-4" aria-hidden="true" />
      Suspender
    </button>
  );
}

const BADGE_SUSP =
  "inline-block rounded-full border-2 border-rose-700 bg-rose-100 px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-rose-950";

export default function AdminLocalesPage() {
  const { notify } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [target, setTarget] = useState<LocalRow | null>(null);
  const [motivo, setMotivo] = useState("");
  const [locales, setLocales] = useState<LocalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [mercado, setMercado] = useState("TODOS");

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/comerciantes", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLocales(data.locales || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cambiarEstado(l: LocalRow, accion: "SUSPENDER" | "REACTIVAR") {
    setBusyId(l.id);
    try {
      const res = await fetch(`/api/admin/comerciantes/${l.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, motivo: motivo.trim() }),
      });
      if (!res.ok) {
        notify("No se pudo actualizar el local.", "error");
        return;
      }
      notify(
        accion === "SUSPENDER"
          ? "Local suspendido. Sus avisos quedaron ocultos."
          : "Local reactivado.",
        accion === "SUSPENDER" ? "info" : "success"
      );
      setTarget(null);
      setMotivo("");
      await cargar();
    } finally {
      setBusyId(null);
    }
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return locales.filter((l) => {
      if (mercado !== "TODOS" && l.mercado !== mercado) return false;
      if (!q) return true;
      return [l.nombre, l.email, l.puesto, l.mercado]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [locales, busqueda, mercado]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-slate-950">
          Locales y comerciantes
        </h2>
        <p className="text-sm font-semibold text-slate-700">
          Actividad de cada puesto: cuánto publica, cuánto se rescata y si
          acumula reportes.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="buscar-local" className="sr-only">
            Buscar por nombre, puesto o correo
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-600"
            aria-hidden="true"
          />
          <input
            id="buscar-local"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar nombre, puesto o correo"
            className="min-h-[48px] w-full rounded-xl border-2 border-slate-900 bg-white pr-3 pl-9 text-base text-slate-950"
          />
        </div>
        <label htmlFor="filtro-mercado-admin" className="sr-only">
          Filtrar por mercado
        </label>
        <select
          id="filtro-mercado-admin"
          value={mercado}
          onChange={(e) => setMercado(e.target.value)}
          className="min-h-[48px] rounded-xl border-2 border-slate-900 bg-white px-3 text-sm font-extrabold text-slate-950"
        >
          <option value="TODOS">Todos los mercados</option>
          {MERCADOS_SANTA_CRUZ.map((m) => (
            <option key={m.nombre} value={m.nombre}>
              {m.nombre}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs font-bold text-slate-700" aria-live="polite">
        {loading ? "Cargando..." : `${filtrados.length} local(es)`}
      </p>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-rose-800 bg-rose-50 p-4 text-sm font-bold text-rose-950"
        >
          <span>No se pudo cargar el listado.</span>
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

      {/* Móvil: tarjetas */}
      <div className="space-y-3 md:hidden">
        {!loading && !error && filtrados.length === 0 && (
          <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 text-center font-bold">
            No hay locales que coincidan.
          </div>
        )}
        {filtrados.map((l) => (
          <article
            key={l.id}
            className="space-y-3 rounded-2xl border-2 border-slate-900 bg-white p-4"
          >
            <div>
              <h3 className="text-base font-black text-slate-950">
                {l.puesto || "Sin puesto"}
              </h3>
              <p className="text-xs font-bold text-slate-700">
                {l.mercado || "Sin mercado"}
              </p>
              {l.suspendido && (
                <p className="mt-1">
                  <span className={BADGE_SUSP}>Suspendido</span>
                </p>
              )}
              <p className="mt-1 text-xs text-slate-800">
                {l.nombre} · {l.email}
              </p>
              {l.telefono && (
                <p className="text-xs text-slate-800">{l.telefono}</p>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-2 text-center">
              {[
                ["Publicados", l.totalPublicaciones],
                ["Activos", l.activas],
                ["Entregas", l.entregasConfirmadas],
                ["Kg rescatados", l.kgRescatados],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-100 p-2">
                  <dt className="text-[11px] font-extrabold uppercase text-slate-700">
                    {k}
                  </dt>
                  <dd className="text-xl font-black text-slate-950">{v}</dd>
                </div>
              ))}
            </dl>
            <BotonEstado
              l={l}
              full
              busy={busyId === l.id}
              onSuspender={() => setTarget(l)}
              onReactivar={() => cambiarEstado(l, "REACTIVAR")}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
              <span>Última publicación: {fecha(l.ultimaPublicacion)}</span>
              {l.reportadas > 0 && (
                <Link
                  href="/admin/publicaciones?filtro=reportadas"
                  className="inline-flex min-h-[48px] items-center gap-1 font-extrabold text-rose-900 underline underline-offset-4"
                >
                  <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                  {l.reportadas} reporte(s)
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Escritorio: tabla */}
      <div className="hidden overflow-x-auto rounded-2xl border-2 border-slate-900 bg-white md:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Locales de comerciantes y su actividad de rescate
          </caption>
          <thead className="border-b-2 border-slate-900 bg-slate-100 text-xs font-black uppercase text-slate-950">
            <tr>
              <th scope="col" className="px-4 py-3">Local</th>
              <th scope="col" className="px-4 py-3">Contacto</th>
              <th scope="col" className="px-4 py-3 text-right">Publicados</th>
              <th scope="col" className="px-4 py-3 text-right">Activos</th>
              <th scope="col" className="px-4 py-3 text-right">Entregas</th>
              <th scope="col" className="px-4 py-3 text-right">Kg</th>
              <th scope="col" className="px-4 py-3">Reportes</th>
              <th scope="col" className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center font-bold">
                  Cargando locales...
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center font-bold">
                  No hay locales que coincidan.
                </td>
              </tr>
            ) : (
              filtrados.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <th scope="row" className="px-4 py-3 align-top font-normal">
                    <p className="font-extrabold text-slate-950">
                      {l.puesto || "Sin puesto"}
                    </p>
                    <p className="text-xs text-slate-700">
                      {l.mercado || "Sin mercado"}
                    </p>
                    <p className="text-xs text-slate-600">
                      Última: {fecha(l.ultimaPublicacion)}
                    </p>
                    {l.suspendido && (
                      <span className={BADGE_SUSP}>Suspendido</span>
                    )}
                  </th>
                  <td className="px-4 py-3 align-top">
                    <p className="font-bold text-slate-950">{l.nombre}</p>
                    <p className="text-xs text-slate-700">{l.email}</p>
                    {l.telefono && (
                      <p className="text-xs text-slate-700">{l.telefono}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right align-top font-bold">
                    {l.totalPublicaciones}
                  </td>
                  <td className="px-4 py-3 text-right align-top font-bold">
                    {l.activas}
                  </td>
                  <td className="px-4 py-3 text-right align-top font-bold">
                    {l.entregasConfirmadas}
                  </td>
                  <td className="px-4 py-3 text-right align-top font-bold">
                    {l.kgRescatados}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {l.reportadas > 0 ? (
                      <Link
                        href="/admin/publicaciones?filtro=reportadas"
                        className="inline-flex min-h-[48px] items-center gap-1 text-xs font-extrabold text-rose-900 underline underline-offset-4"
                      >
                        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                        {l.reportadas}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <BotonEstado
                      l={l}
                      busy={busyId === l.id}
                      onSuspender={() => setTarget(l)}
                      onReactivar={() => cambiarEstado(l, "REACTIVAR")}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={Boolean(target)}
        title="¿Suspender este local?"
        description={`${target?.puesto || target?.nombre} no podrá ingresar ni publicar. Sus avisos activos se ocultarán y las reservas pendientes se cancelarán.`}
        confirmLabel="Sí, suspender"
        loading={Boolean(busyId)}
        onConfirm={() => target && cambiarEstado(target, "SUSPENDER")}
        onCancel={() => {
          setTarget(null);
          setMotivo("");
        }}
      >
        <label
          htmlFor="motivo-suspension"
          className="mt-4 block text-sm font-extrabold text-slate-950"
        >
          Motivo (visible para el comerciante)
        </label>
        <textarea
          id="motivo-suspension"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={200}
          rows={3}
          className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-base text-slate-950"
        />
      </ConfirmModal>
    </div>
  );
}

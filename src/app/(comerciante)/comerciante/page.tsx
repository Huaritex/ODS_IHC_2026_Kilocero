"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  XCircle,
  CloudOff,
  RefreshCw,
  PlusCircle,
  Phone,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api-client";
import type {
  CantidadAproximada,
  CategoriaAlimento,
  EstadoPublicacion,
} from "@/lib/types";
import { CANTIDAD_MAP, CATEGORIA_MAP } from "@/lib/constants";
import {
  enqueueComercianteAction,
  fetchWithTimeout,
  flushOfflineQueue,
  getOfflineActions,
  getOfflineQueue,
  QUEUE_UPDATED_EVENT,
  removeQueuedPublicacion,
  type QueuedComercianteAction,
  type QueuedPublicacion,
} from "@/lib/offline-queue";
import { EstadoPublicacionBadge } from "@/components/ui/EstadoBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EncuestaUsabilidadModal } from "@/components/EncuestaUsabilidadModal";
import { useToast } from "@/components/ToastProvider";

interface PublicacionItem {
  id: string;
  categoria: CategoriaAlimento;
  cantidadAproximada: CantidadAproximada;
  descripcion: string | null;
  mercado: string;
  direccionTexto: string;
  ventanaInicio: string;
  ventanaFin: string;
  estado: EstadoPublicacion;
  reservas: Array<{
    id: string;
    codigoRetiro: string | null;
    estado: string;
    confirmadoComerciante: boolean;
    confirmadoReceptor: boolean;
    receptor: {
      nombre: string;
      organizacion: string | null;
      telefono: string | null;
    };
  }>;
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWhatsappUrl(telefono: string) {
  const digits = telefono.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("591") ? digits : `591${digits}`}`;
}

export default function ComercianteDashboardPage() {
  const { notify } = useToast();
  const [publicaciones, setPublicaciones] = useState<PublicacionItem[]>([]);
  const [colaLocal, setColaLocal] = useState<QueuedPublicacion[]>([]);
  const [accionesLocales, setAccionesLocales] = useState<
    QueuedComercianteAction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showEncuesta, setShowEncuesta] = useState(false);

  const cargarDatos = useCallback(async () => {
    setColaLocal(getOfflineQueue());
    setAccionesLocales(getOfflineActions());
    try {
      setError(null);
      const res = await fetchWithTimeout(
        "/api/publicaciones?mine=1",
        { cache: "no-store" },
        6000
      );
      if (!res.ok) {
        throw new Error("No se pudieron cargar tus publicaciones.");
      }
      const data = await res.json();
      setPublicaciones(data.publicaciones || []);
    } catch {
      setError("Sin conexión con el servidor. Mostrando cola local.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    const onQueue = () => {
      setColaLocal(getOfflineQueue());
      setAccionesLocales(getOfflineActions());
    };
    const onSynced = () => cargarDatos();
    window.addEventListener(QUEUE_UPDATED_EVENT, onQueue);
    window.addEventListener("kilocero:publicaciones-synced", onSynced);
    return () => {
      window.removeEventListener(QUEUE_UPDATED_EVENT, onQueue);
      window.removeEventListener("kilocero:publicaciones-synced", onSynced);
    };
  }, [cargarDatos]);

  async function confirmarEntrega(reservaId: string, label: string) {
    if (!navigator.onLine) {
      enqueueComercianteAction("CONFIRMAR_ENTREGA", reservaId, label);
      notify(
        "Sin señal: confirmación guardada para enviarse al volver el internet.",
        "info"
      );
      return;
    }

    setActionId(reservaId);
    try {
      const res = await fetchWithTimeout(
        `/api/reservas/${reservaId}/confirmar`,
        { method: "POST" },
        6000
      );
      if (res.status >= 500) {
        enqueueComercianteAction("CONFIRMAR_ENTREGA", reservaId, label);
        notify("Servidor sin respuesta: guardado en cola para reintentar.", "info");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "No se pudo confirmar.", "error");
        return;
      }
      notify(
        data.ambosConfirmaron
          ? "¡Entrega confirmada por ambas partes! Gracias por rescatar alimentos."
          : "Confirmaste la entrega. Falta que el comedor confirme.",
        "success"
      );
      setShowEncuesta(true);
      await cargarDatos();
    } catch {
      enqueueComercianteAction("CONFIRMAR_ENTREGA", reservaId, label);
      notify(
        "Conexión caída: confirmación guardada como 'Pendiente de envío'.",
        "info"
      );
    } finally {
      setActionId(null);
    }
  }

  async function eliminarPublicacion() {
    if (!confirmDeleteId) return;
    setActionId(confirmDeleteId);
    const r = await api(`/api/publicaciones/${confirmDeleteId}`, {
      method: "DELETE",
    });
    setActionId(null);
    if (!r.ok) {
      notify(r.error ?? "No se pudo eliminar el aviso.", "error");
      return;
    }
    notify("Aviso eliminado.", "info");
    setConfirmDeleteId(null);
    await cargarDatos();
  }

  async function cerrarPublicacion() {
    if (!confirmCloseId) return;
    if (!navigator.onLine) {
      enqueueComercianteAction(
        "CERRAR_PUBLICACION",
        confirmCloseId,
        "Cerrar publicación"
      );
      setConfirmCloseId(null);
      notify("Sin señal: el cierre se enviará al volver la conexión.", "info");
      return;
    }

    setActionId(confirmCloseId);
    try {
      const res = await fetchWithTimeout(
        `/api/publicaciones/${confirmCloseId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accion: "EXPIRAR" }),
        },
        6000
      );
      if (res.status >= 500) {
        enqueueComercianteAction(
          "CERRAR_PUBLICACION",
          confirmCloseId,
          "Cerrar publicación"
        );
        setConfirmCloseId(null);
        notify("Guardado en cola para cerrar al reconectar.", "info");
        return;
      }
      if (!res.ok) {
        notify("No se pudo cerrar la publicación.", "error");
        return;
      }
      notify("Publicación cerrada.", "info");
      setConfirmCloseId(null);
      await cargarDatos();
    } catch {
      enqueueComercianteAction(
        "CERRAR_PUBLICACION",
        confirmCloseId,
        "Cerrar publicación"
      );
      setConfirmCloseId(null);
      notify("Sin señal: cierre guardado en cola local.", "info");
    } finally {
      setActionId(null);
    }
  }

  async function reintentarCola() {
    const { enviadas } = await flushOfflineQueue();
    if (enviadas > 0) {
      notify(`Se sincronizaron ${enviadas} operación(es).`, "success");
      cargarDatos();
    } else {
      notify("Todavía no se pudo enviar. Revisá tu señal.", "error");
    }
  }

  const totalPendiente = colaLocal.length + accionesLocales.length;

  return (
    <div className="space-y-5">
      {totalPendiente > 0 && (
        <section
          aria-label="Operaciones pendientes de envío"
          className="rounded-2xl border-2 border-amber-700 bg-amber-50 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-950">
              <CloudOff className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h2 className="text-base font-black">
                Pendiente de envío ({totalPendiente})
              </h2>
            </div>
            <button
              type="button"
              onClick={reintentarCola}
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
            {colaLocal.map((item) => {
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
            {accionesLocales.map((act) => (
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
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-950">Mis publicaciones</h2>
        <button
          type="button"
          onClick={cargarDatos}
          className="min-h-[48px] rounded-xl px-3 text-sm font-bold text-slate-800 underline"
        >
          Actualizar
        </button>
      </div>

      {loading && (
        <div className="rounded-2xl border-2 border-slate-300 bg-white p-6 text-center text-base font-bold text-slate-700">
          Cargando tus publicaciones...
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border-2 border-rose-700 bg-rose-50 p-4 text-sm font-bold text-rose-950"
        >
          {error}
        </div>
      )}

      {!loading && publicaciones.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-400 bg-white p-6 text-center">
          <p className="text-lg font-extrabold text-slate-950">
            Todavía no publicaste excedentes hoy
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Tocá el botón verde abajo para publicar en menos de 20 segundos.
          </p>
          <Link
            href="/comerciante/publicar"
            className="mt-4 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 text-base font-extrabold text-white"
          >
            <PlusCircle className="h-5 w-5" aria-hidden="true" />
            <span>Publicar ahora</span>
          </Link>
        </div>
      )}

      <ul className="space-y-4">
        {publicaciones.map((pub) => {
          const cat = CATEGORIA_MAP[pub.categoria];
          const cant = CANTIDAD_MAP[pub.cantidadAproximada];
          const reservaActiva = pub.reservas.find(
            (r) => r.estado === "ACTIVA" || r.estado === "COMPLETADA"
          );
          const tieneConfirmPendiente =
            reservaActiva &&
            accionesLocales.some(
              (a) =>
                a.tipo === "CONFIRMAR_ENTREGA" &&
                a.targetId === reservaActiva.id
            );

          return (
            <li
              key={pub.id}
              className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl" aria-hidden="true">
                    {cat.emoji}
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-950">
                      {cat.label} · {cant.label}
                    </h3>
                    <p className="text-xs font-bold text-slate-700">
                      {cant.referencia}
                    </p>
                  </div>
                </div>
                <EstadoPublicacionBadge estado={pub.estado} />
              </div>

              {pub.descripcion && (
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {pub.descripcion}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Retiro: {formatHora(pub.ventanaInicio)} –{" "}
                  {formatHora(pub.ventanaFin)}
                </span>
              </div>

              {reservaActiva && (
                <div className="mt-3 rounded-xl border-2 border-slate-300 bg-slate-50 p-3 text-sm">
                  <p className="font-extrabold text-slate-950">
                    Reservado por:{" "}
                    {reservaActiva.receptor.organizacion ||
                      reservaActiva.receptor.nombre}
                  </p>
                  {reservaActiva.codigoRetiro && (
                    <p className="mt-1 inline-block rounded-lg border-2 border-slate-900 bg-amber-100 px-2.5 py-0.5 text-xs font-black tracking-wider text-slate-950">
                      Código de retiro: {reservaActiva.codigoRetiro}
                    </p>
                  )}
                  <p className="mt-1 text-xs font-bold text-slate-800">
                    {reservaActiva.confirmadoReceptor
                      ? "✓ El comedor ya confirmó retiro"
                      : "◷ Esperando que el comedor retire"}
                    {" · "}
                    {reservaActiva.confirmadoComerciante
                      ? "✓ Vos confirmaste"
                      : tieneConfirmPendiente
                        ? "◷ Confirmación pendiente de envío"
                        : "Falta tu confirmación"}
                  </p>

                  {reservaActiva.receptor.telefono && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <a
                        href={formatWhatsappUrl(
                          reservaActiva.receptor.telefono
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-900 bg-emerald-100 px-3 text-xs font-extrabold text-emerald-950 hover:bg-emerald-200"
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        <span>WhatsApp</span>
                      </a>
                      <a
                        href={`tel:${reservaActiva.receptor.telefono}`}
                        className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-900 bg-white px-3 text-xs font-extrabold text-slate-950 hover:bg-slate-100"
                      >
                        <Phone className="h-4 w-4" aria-hidden="true" />
                        <span>Llamar</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2">
                {reservaActiva &&
                  (pub.estado === "RESERVADO" || pub.estado === "RETIRADO") &&
                  !reservaActiva.confirmadoComerciante &&
                  !tieneConfirmPendiente && (
                    <button
                      type="button"
                      disabled={actionId === reservaActiva.id}
                      onClick={() =>
                        confirmarEntrega(
                          reservaActiva.id,
                          `Confirmar entrega: ${cat.label} (${reservaActiva.receptor.organizacion || reservaActiva.receptor.nombre})`
                        )
                      }
                      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 text-base font-extrabold text-white hover:bg-emerald-900 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                      <span>
                        {actionId === reservaActiva.id
                          ? "Confirmando..."
                          : "Confirmar que ya retiraron"}
                      </span>
                    </button>
                  )}

                {pub.estado === "DISPONIBLE" && (
                  <Link
                    href={`/comerciante/editar/${pub.id}`}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-4 text-sm font-extrabold text-slate-950 hover:bg-slate-100"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    <span>Editar aviso</span>
                  </Link>
                )}

                {(pub.estado === "DISPONIBLE" || pub.estado === "EXPIRADO") &&
                  !reservaActiva && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(pub.id)}
                      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-rose-800 bg-white px-4 text-sm font-extrabold text-rose-900 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span>Eliminar aviso</span>
                    </button>
                  )}

                {pub.estado === "DISPONIBLE" && (
                  <button
                    type="button"
                    onClick={() => setConfirmCloseId(pub.id)}
                    className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-rose-800 bg-white px-4 text-sm font-extrabold text-rose-900 hover:bg-rose-50"
                  >
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    <span>Cerrar publicación (ya no disponible)</span>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmModal
        open={Boolean(confirmCloseId)}
        title="¿Cerrar esta publicación?"
        description="Si la cerrás, dejará de aparecer para los comedores y no se podrá reabrir."
        confirmLabel="Sí, cerrar publicación"
        loading={Boolean(actionId)}
        onConfirm={cerrarPublicacion}
        onCancel={() => setConfirmCloseId(null)}
      />

      <ConfirmModal
        open={Boolean(confirmDeleteId)}
        title="¿Eliminar este aviso?"
        description="Se borra definitivamente y no se puede recuperar. Si solo ya no queda producto, mejor cerralo."
        confirmLabel="Sí, eliminar"
        loading={Boolean(actionId)}
        onConfirm={eliminarPublicacion}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <EncuestaUsabilidadModal
        open={showEncuesta}
        onClose={() => setShowEncuesta(false)}
      />
    </div>
  );
}

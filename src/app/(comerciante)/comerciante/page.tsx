"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import {
  enqueueComercianteAction,
  flushOfflineQueue,
  getOfflineActions,
  getOfflineQueue,
  QUEUE_UPDATED_EVENT,
  type QueuedComercianteAction,
  type QueuedPublicacion,
} from "@/lib/offline-queue";
import { AvisoCard, type PublicacionItem } from "@/components/comerciante/AvisoCard";
import { ColaPendiente } from "@/components/comerciante/ColaPendiente";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EncuestaUsabilidadModal } from "@/components/EncuestaUsabilidadModal";
import { useToast } from "@/components/ToastProvider";

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
    setError(null);
    const r = await api<{ publicaciones: PublicacionItem[] }>(
      "/api/publicaciones?mine=1",
      { timeoutMs: 6000 }
    );
    if (r.ok && r.data) setPublicaciones(r.data.publicaciones || []);
    else setError("Sin conexión con el servidor. Mostrando cola local.");
    setLoading(false);
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

  /** Sin señal o servidor caído: la acción se guarda en la cola local. */
  const sinRespuesta = (status: number) => status === 0 || status >= 500;

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
    const r = await api<{ ambosConfirmaron?: boolean }>(
      `/api/reservas/${reservaId}/confirmar`,
      { method: "POST", timeoutMs: 6000 }
    );
    setActionId(null);

    if (sinRespuesta(r.status)) {
      enqueueComercianteAction("CONFIRMAR_ENTREGA", reservaId, label);
      notify(
        "Servidor sin respuesta: confirmación guardada como 'Pendiente de envío'.",
        "info"
      );
      return;
    }
    if (!r.ok || !r.data) {
      notify(r.error || "No se pudo confirmar.", "error");
      return;
    }
    notify(
      r.data.ambosConfirmaron
        ? "¡Entrega confirmada por ambas partes! Gracias por rescatar alimentos."
        : "Confirmaste la entrega. Falta que el comedor confirme.",
      "success"
    );
    setShowEncuesta(true);
    await cargarDatos();
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
    const id = confirmCloseId;
    const encolar = (mensaje: string) => {
      enqueueComercianteAction("CERRAR_PUBLICACION", id, "Cerrar publicación");
      setConfirmCloseId(null);
      notify(mensaje, "info");
    };

    if (!navigator.onLine) {
      encolar("Sin señal: el cierre se enviará al volver la conexión.");
      return;
    }

    setActionId(id);
    const r = await api(`/api/publicaciones/${id}`, {
      method: "PATCH",
      json: { accion: "EXPIRAR" },
      timeoutMs: 6000,
    });
    setActionId(null);

    if (sinRespuesta(r.status)) {
      encolar("Sin respuesta del servidor: cierre guardado en cola local.");
      return;
    }
    if (!r.ok) {
      notify(r.error || "No se pudo cerrar la publicación.", "error");
      return;
    }
    notify("Publicación cerrada.", "info");
    setConfirmCloseId(null);
    await cargarDatos();
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
        <ColaPendiente
          total={totalPendiente}
          cola={colaLocal}
          acciones={accionesLocales}
          onRetry={reintentarCola}
        />
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
        {publicaciones.map((pub) => (
          <AvisoCard
            key={pub.id}
            pub={pub}
            accionesLocales={accionesLocales}
            actionId={actionId}
            onConfirmar={confirmarEntrega}
            onCerrar={setConfirmCloseId}
            onEliminar={setConfirmDeleteId}
          />
        ))}
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

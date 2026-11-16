"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EncuestaUsabilidadModal } from "@/components/EncuestaUsabilidadModal";
import { ReservaCard, type ReservaItem } from "@/components/receptor/ReservaCard";
import { useToast } from "@/components/ToastProvider";

export default function ReceptorReservasPage() {
  const { notify } = useToast();
  const [reservas, setReservas] = useState<ReservaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [showEncuesta, setShowEncuesta] = useState(false);

  const cargar = useCallback(async () => {
    const r = await api<{ reservas: ReservaItem[] }>("/api/reservas");
    if (r.ok && r.data) setReservas(r.data.reservas || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function confirmarRetiro(id: string) {
    setActionId(id);
    const r = await api<{ ambosConfirmaron?: boolean }>(
      `/api/reservas/${id}/confirmar`,
      { method: "POST" }
    );
    setActionId(null);
    if (!r.ok || !r.data) {
      notify(r.error || "No se pudo confirmar.", "error");
      return;
    }
    notify(
      r.data.ambosConfirmaron
        ? "¡Entrega completada y cerrada por ambas partes!"
        : "Retiro confirmado. Falta que el comerciante confirme.",
      "success"
    );
    setShowEncuesta(true);
    await cargar();
  }

  async function cancelarReserva() {
    if (!cancelTargetId) return;
    setActionId(cancelTargetId);
    const r = await api(`/api/reservas/${cancelTargetId}/cancelar`, {
      method: "POST",
    });
    setActionId(null);
    if (!r.ok) {
      notify(r.error || "No se pudo cancelar la reserva.", "error");
      return;
    }
    notify("Reserva cancelada. El excedente volvió a estar disponible.", "info");
    setCancelTargetId(null);
    await cargar();
  }

  return (
    <div className="space-y-4">
      <Link
        href="/receptor"
        className="inline-flex min-h-[48px] items-center text-sm font-bold text-slate-700 underline underline-offset-4"
      >
        ← Volver a explorar
      </Link>
      <h2 className="text-2xl font-black text-slate-950">Mis reservas</h2>

      {loading ? (
        <div className="rounded-2xl border-2 border-slate-300 bg-white p-6 text-center font-bold">
          Cargando reservas...
        </div>
      ) : reservas.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-400 bg-white p-6 text-center">
          <p className="text-lg font-extrabold text-slate-950">
            Aún no tenés reservas
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Explorá los excedentes disponibles en Santa Cruz y reservá el
            primero.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reservas.map((r) => (
            <ReservaCard
              key={r.id}
              r={r}
              confirmando={actionId === r.id}
              onConfirmar={() => confirmarRetiro(r.id)}
              onCancelar={() => setCancelTargetId(r.id)}
            />
          ))}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(cancelTargetId)}
        title="¿Cancelar esta reserva?"
        description="El excedente volverá a quedar disponible para otros comedores."
        confirmLabel="Sí, cancelar reserva"
        loading={Boolean(actionId)}
        onConfirm={cancelarReserva}
        onCancel={() => setCancelTargetId(null)}
      />

      <EncuestaUsabilidadModal
        open={showEncuesta}
        onClose={() => setShowEncuesta(false)}
      />
    </div>
  );
}

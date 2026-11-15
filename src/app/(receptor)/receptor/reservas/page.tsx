"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  MapPin,
  XCircle,
  Navigation,
  MessageCircle,
  Phone,
} from "lucide-react";
import type {
  CantidadAproximada,
  CategoriaAlimento,
  EstadoPublicacion,
} from "@/lib/types";
import { CANTIDAD_MAP, CATEGORIA_MAP } from "@/lib/constants";
import { EstadoPublicacionBadge } from "@/components/ui/EstadoBadge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EncuestaUsabilidadModal } from "@/components/EncuestaUsabilidadModal";
import { useToast } from "@/components/ToastProvider";

interface ReservaItem {
  id: string;
  codigoRetiro: string | null;
  estado: "ACTIVA" | "COMPLETADA" | "CANCELADA" | "EXPIRADA";
  confirmadoReceptor: boolean;
  confirmadoComerciante: boolean;
  ventanaRetiroInicio: string;
  ventanaRetiroFin: string;
  publicacion: {
    id: string;
    categoria: CategoriaAlimento;
    cantidadAproximada: CantidadAproximada;
    mercado: string;
    direccionTexto: string;
    lat: number;
    lng: number;
    estado: EstadoPublicacion;
    comerciante: {
      nombre: string;
      puesto: string | null;
      telefono: string | null;
    };
  };
}

function formatWhatsappUrl(telefono: string) {
  const digits = telefono.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("591") ? digits : `591${digits}`}`;
}

export default function ReceptorReservasPage() {
  const { notify } = useToast();
  const [reservas, setReservas] = useState<ReservaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [showEncuesta, setShowEncuesta] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/reservas", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setReservas(data.reservas || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function confirmarRetiro(id: string) {
    setActionId(id);
    try {
      const res = await fetch(`/api/reservas/${id}/confirmar`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "No se pudo confirmar.", "error");
        return;
      }
      notify(
        data.ambosConfirmaron
          ? "¡Entrega completada y cerrada por ambas partes!"
          : "Retiro confirmado. Falta que el comerciante confirme.",
        "success"
      );
      setShowEncuesta(true);
      await cargar();
    } finally {
      setActionId(null);
    }
  }

  async function cancelarReserva() {
    if (!cancelTargetId) return;
    setActionId(cancelTargetId);
    try {
      const res = await fetch(`/api/reservas/${cancelTargetId}/cancelar`, {
        method: "POST",
      });
      if (!res.ok) {
        notify("No se pudo cancelar la reserva.", "error");
        return;
      }
      notify(
        "Reserva cancelada. El excedente volvió a estar disponible.",
        "info"
      );
      setCancelTargetId(null);
      await cargar();
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-4">
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
          {reservas.map((r) => {
            const cat = CATEGORIA_MAP[r.publicacion.categoria];
            const cant = CANTIDAD_MAP[r.publicacion.cantidadAproximada];
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${r.publicacion.lat},${r.publicacion.lng}`;
            const tel = r.publicacion.comerciante.telefono;

            return (
              <li
                key={r.id}
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
                        {r.publicacion.comerciante.nombre}
                      </p>
                    </div>
                  </div>
                  <EstadoPublicacionBadge estado={r.publicacion.estado} />
                </div>

                {r.codigoRetiro && r.estado === "ACTIVA" && (
                  <div className="mt-3 rounded-xl border-2 border-slate-900 bg-amber-100 px-3 py-2 text-center">
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">
                      Mostrale este código al comerciante
                    </p>
                    <p className="text-xl font-black tracking-widest text-slate-950">
                      {r.codigoRetiro}
                    </p>
                  </div>
                )}

                <div className="mt-3 space-y-1 text-sm font-bold text-slate-800">
                  <p className="flex items-center gap-1.5 text-slate-950">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {r.publicacion.mercado}
                      {r.publicacion.comerciante.puesto
                        ? ` · ${r.publicacion.comerciante.puesto}`
                        : ` · ${r.publicacion.direccionTexto}`}
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      Retiro:{" "}
                      {new Date(r.ventanaRetiroInicio).toLocaleTimeString(
                        "es-BO",
                        { hour: "2-digit", minute: "2-digit" }
                      )}{" "}
                      –{" "}
                      {new Date(r.ventanaRetiroFin).toLocaleTimeString(
                        "es-BO",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </span>
                  </p>
                </div>

                <p className="mt-2 text-xs font-extrabold text-slate-700">
                  {r.confirmadoReceptor
                    ? "✓ Vos confirmaste el retiro"
                    : "◷ Confirmá al recibir los alimentos en el puesto"}
                  {" · "}
                  {r.confirmadoComerciante
                    ? "✓ Comerciante confirmó"
                    : "◷ Falta confirmación del comerciante"}
                </p>

                {r.estado === "ACTIVA" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-900 bg-slate-100 px-3 text-xs font-extrabold text-slate-950 hover:bg-slate-200"
                    >
                      <Navigation className="h-4 w-4" aria-hidden="true" />
                      <span>Cómo llegar</span>
                    </a>
                    {tel && (
                      <>
                        <a
                          href={formatWhatsappUrl(tel)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-900 bg-emerald-100 px-3 text-xs font-extrabold text-emerald-950 hover:bg-emerald-200"
                        >
                          <MessageCircle
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`tel:${tel}`}
                          className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-900 bg-white px-3 text-xs font-extrabold text-slate-950 hover:bg-slate-100"
                        >
                          <Phone className="h-4 w-4" aria-hidden="true" />
                          <span>Llamar</span>
                        </a>
                      </>
                    )}
                  </div>
                )}

                {r.estado === "ACTIVA" && (
                  <div className="mt-3 flex flex-col gap-2">
                    {!r.confirmadoReceptor && (
                      <button
                        type="button"
                        disabled={actionId === r.id}
                        onClick={() => confirmarRetiro(r.id)}
                        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 text-base font-extrabold text-white hover:bg-emerald-900 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                        <span>
                          {actionId === r.id
                            ? "Confirmando..."
                            : "Confirmar que ya retiré"}
                        </span>
                      </button>
                    )}

                    {!r.confirmadoReceptor && (
                      <button
                        type="button"
                        onClick={() => setCancelTargetId(r.id)}
                        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-rose-800 bg-white px-4 text-sm font-extrabold text-rose-900 hover:bg-rose-50"
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        <span>Cancelar reserva</span>
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
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

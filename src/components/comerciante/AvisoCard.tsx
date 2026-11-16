"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Pencil,
  Phone,
  Trash2,
  XCircle,
} from "lucide-react";
import type {
  CantidadAproximada,
  CategoriaAlimento,
  EstadoPublicacion,
} from "@/lib/types";
import { CANTIDAD_MAP, CATEGORIA_MAP } from "@/lib/constants";
import { formatHora, formatWhatsappUrl } from "@/lib/formato";
import type { QueuedComercianteAction } from "@/lib/offline-queue";
import { EstadoPublicacionBadge } from "@/components/ui/EstadoBadge";

export interface PublicacionItem {
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

interface AvisoCardProps {
  pub: PublicacionItem;
  accionesLocales: QueuedComercianteAction[];
  actionId: string | null;
  onConfirmar: (reservaId: string, label: string) => void;
  onCerrar: (id: string) => void;
  onEliminar: (id: string) => void;
}

/** Tarjeta de un aviso del comerciante con sus acciones según el estado. */
export function AvisoCard({
  pub,
  accionesLocales,
  actionId,
  onConfirmar,
  onCerrar,
  onEliminar,
}: AvisoCardProps) {
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
                  onConfirmar(
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
                onClick={() => onEliminar(pub.id)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-rose-800 bg-white px-4 text-sm font-extrabold text-rose-900 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Eliminar aviso</span>
              </button>
            )}

          {pub.estado === "DISPONIBLE" && (
            <button
              type="button"
              onClick={() => onCerrar(pub.id)}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-rose-800 bg-white px-4 text-sm font-extrabold text-rose-900 hover:bg-rose-50"
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              <span>Cerrar publicación (ya no disponible)</span>
            </button>
          )}
        </div>
      </li>
    );
}

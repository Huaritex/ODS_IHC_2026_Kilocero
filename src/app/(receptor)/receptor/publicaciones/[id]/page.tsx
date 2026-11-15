"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Flag,
  CheckCircle2,
  Navigation,
  MessageCircle,
  Phone,
  Lock,
} from "lucide-react";
import type {
  CantidadAproximada,
  CategoriaAlimento,
  EstadoPublicacion,
  EstadoVerificacion,
} from "@/lib/types";
import { CANTIDAD_MAP, CATEGORIA_MAP } from "@/lib/constants";
import { EstadoPublicacionBadge } from "@/components/ui/EstadoBadge";
import { useToast } from "@/components/ToastProvider";

interface PublicacionDetalle {
  id: string;
  categoria: CategoriaAlimento;
  cantidadAproximada: CantidadAproximada;
  descripcion: string | null;
  fotoUrl: string | null;
  mercado: string;
  direccionTexto: string;
  lat: number;
  lng: number;
  ventanaInicio: string;
  ventanaFin: string;
  estado: EstadoPublicacion;
  comerciante: {
    nombre: string;
    puesto: string | null;
    telefono: string | null;
  };
}

function formatWhatsappUrl(telefono: string) {
  const digits = telefono.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("591") ? digits : `591${digits}`}`;
}

export default function ReceptorPublicacionDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useToast();

  const [pub, setPub] = useState<PublicacionDetalle | null>(null);
  const [estadoCuenta, setEstadoCuenta] =
    useState<EstadoVerificacion>("PENDIENTE");
  const [motivoRechazo, setMotivoRechazo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/publicaciones/${params.id}`, { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch("/api/auth/me", { cache: "no-store" }).then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([pubData, meData]) => {
        setPub(pubData?.publicacion || null);
        if (meData?.user?.estadoVerificacion) {
          setEstadoCuenta(meData.user.estadoVerificacion);
          setMotivoRechazo(meData.user.motivoRechazo || null);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleReservar() {
    if (!pub || estadoCuenta !== "VERIFICADO") return;
    setReserving(true);
    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicacionId: pub.id,
          ventanaRetiroInicio: pub.ventanaInicio,
          ventanaRetiroFin: pub.ventanaFin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "No se pudo reservar.", "error");
        setReserving(false);
        return;
      }
      notify(
        "¡Reserva confirmada! Pasá a retirar dentro del horario.",
        "success"
      );
      router.push("/receptor/reservas");
      router.refresh();
    } catch {
      notify("Error de conexión al reservar.", "error");
      setReserving(false);
    }
  }

  async function handleReportar(e: React.FormEvent) {
    e.preventDefault();
    if (!pub) return;
    setReporting(true);
    try {
      const res = await fetch(`/api/publicaciones/${pub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "REPORTAR",
          motivo: motivoReporte || "Producto con problema reportado",
        }),
      });
      if (!res.ok) {
        notify("No se pudo enviar el reporte.", "error");
        return;
      }
      notify("Reporte enviado al equipo administrador.", "info");
      setShowReport(false);
      setMotivoReporte("");
    } finally {
      setReporting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border-2 border-slate-300 bg-white p-6 text-center font-bold">
        Cargando detalle...
      </div>
    );
  }

  if (!pub) {
    return (
      <div className="rounded-2xl border-2 border-rose-700 bg-rose-50 p-6">
        <p className="font-extrabold text-rose-950">
          Publicación no encontrada.
        </p>
        <Link
          href="/receptor"
          className="mt-3 inline-flex min-h-[48px] items-center font-bold underline"
        >
          ← Volver a explorar
        </Link>
      </div>
    );
  }

  const cat = CATEGORIA_MAP[pub.categoria];
  const cant = CANTIDAD_MAP[pub.cantidadAproximada];
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${pub.lat},${pub.lng}`;

  return (
    <div className="space-y-4">
      <Link
        href="/receptor"
        className="inline-flex min-h-[48px] items-center gap-1.5 text-sm font-extrabold text-slate-900 underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        <span>Volver al listado</span>
      </Link>

      <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-4xl" aria-hidden="true">
              {cat.emoji}
            </span>
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                {cat.label} · {cant.label}
              </h2>
              <p className="text-sm font-bold text-slate-700">
                {cant.referencia}
              </p>
            </div>
          </div>
          <EstadoPublicacionBadge estado={pub.estado} />
        </div>

        {pub.fotoUrl && (
          <img
            src={pub.fotoUrl}
            alt={`Foto de ${cat.label}`}
            className="mt-4 max-h-60 w-full rounded-xl border-2 border-slate-300 object-cover"
          />
        )}

        {pub.descripcion && (
          <p className="mt-4 rounded-xl bg-slate-100 p-3 text-base font-medium text-slate-900">
            {pub.descripcion}
          </p>
        )}

        <div className="mt-4 space-y-2 text-sm font-bold text-slate-900">
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {pub.mercado}
              {pub.comerciante.puesto
                ? ` · ${pub.comerciante.puesto}`
                : ` · ${pub.direccionTexto}`}
            </span>
          </p>
          <p className="flex items-center gap-2 text-emerald-900">
            <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Ventana de retiro:{" "}
              {new Date(pub.ventanaInicio).toLocaleTimeString("es-BO", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              –{" "}
              {new Date(pub.ventanaFin).toLocaleTimeString("es-BO", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </p>
          <p className="text-slate-700">
            Comerciante: {pub.comerciante.nombre}
          </p>
        </div>

        {/* Accesos rápidos de ubicación y contacto */}
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-900 bg-slate-100 px-3 text-xs font-extrabold text-slate-950 hover:bg-slate-200"
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            <span>Cómo llegar</span>
          </a>
          {pub.comerciante.telefono && (
            <>
              <a
                href={formatWhatsappUrl(pub.comerciante.telefono)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-900 bg-emerald-100 px-3 text-xs font-extrabold text-emerald-950 hover:bg-emerald-200"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
              <a
                href={`tel:${pub.comerciante.telefono}`}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-900 bg-white px-3 text-xs font-extrabold text-slate-950 hover:bg-slate-100"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                <span>Llamar</span>
              </a>
            </>
          )}
        </div>

        {pub.estado === "DISPONIBLE" &&
          (estadoCuenta === "VERIFICADO" ? (
            <button
              type="button"
              disabled={reserving}
              onClick={handleReservar}
              className="mt-6 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 text-lg font-black text-white hover:bg-emerald-900 disabled:opacity-60"
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              <span>{reserving ? "Reservando..." : "RESERVAR EXCEDENTE"}</span>
            </button>
          ) : (
            <div
              role="status"
              className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-amber-700 bg-amber-50 p-4 text-sm font-extrabold text-slate-950"
            >
              <Lock className="h-5 w-5 shrink-0 text-amber-800" aria-hidden="true" />
              <span>
                {estadoCuenta === "PENDIENTE"
                  ? "No podés reservar todavía: tu cuenta está pendiente de verificación por el Admin."
                  : `Tu cuenta fue rechazada${motivoRechazo ? `: ${motivoRechazo}` : "."}`}
              </span>
            </div>
          ))}

        <div className="mt-4 border-t border-slate-200 pt-3">
          {!showReport ? (
            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="flex min-h-[48px] items-center gap-1.5 text-sm font-bold text-rose-800 underline"
            >
              <Flag className="h-4 w-4" aria-hidden="true" />
              <span>Reportar problema con esta publicación</span>
            </button>
          ) : (
            <form onSubmit={handleReportar} className="space-y-2">
              <label
                htmlFor="motivo-reporte"
                className="block text-sm font-extrabold text-slate-950"
              >
                Motivo del reporte
              </label>
              <input
                id="motivo-reporte"
                required
                value={motivoReporte}
                onChange={(e) => setMotivoReporte(e.target.value)}
                placeholder="Ej. Alimento en mal estado o puesto cerrado"
                className="min-h-[48px] w-full rounded-xl border-2 border-slate-900 px-3 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={reporting}
                  className="min-h-[48px] flex-1 rounded-xl bg-rose-700 px-4 text-sm font-extrabold text-white"
                >
                  {reporting ? "Enviando..." : "Enviar reporte"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReport(false)}
                  className="min-h-[48px] rounded-xl border-2 border-slate-900 px-4 text-sm font-bold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

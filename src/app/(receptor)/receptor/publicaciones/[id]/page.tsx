"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatHora } from "@/lib/formato";
import { lugarPublicacion } from "@/lib/lugar";
import type {
  CantidadAproximada,
  CategoriaAlimento,
  EstadoPublicacion,
  EstadoVerificacion,
} from "@/lib/types";
import { CANTIDAD_MAP, CATEGORIA_MAP } from "@/lib/constants";
import { EstadoPublicacionBadge } from "@/components/ui/EstadoBadge";
import { AccesosContacto } from "@/components/receptor/AccesosContacto";
import { BloqueReserva } from "@/components/receptor/BloqueReserva";
import { ReportarPublicacion } from "@/components/receptor/ReportarPublicacion";
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
  comerciante: { nombre: string; puesto: string | null; telefono: string | null };
}

interface Me {
  user?: { estadoVerificacion?: EstadoVerificacion; motivoRechazo?: string | null };
}

export default function ReceptorPublicacionDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useToast();

  const [pub, setPub] = useState<PublicacionDetalle | null>(null);
  const [estadoCuenta, setEstadoCuenta] = useState<EstadoVerificacion>("PENDIENTE");
  const [motivoRechazo, setMotivoRechazo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reservando, setReservando] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ publicacion: PublicacionDetalle }>(`/api/publicaciones/${params.id}`),
      api<Me>("/api/auth/me"),
    ])
      .then(([pubRes, meRes]) => {
        setPub(pubRes.data?.publicacion || null);
        const u = meRes.data?.user;
        if (u?.estadoVerificacion) {
          setEstadoCuenta(u.estadoVerificacion);
          setMotivoRechazo(u.motivoRechazo || null);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  async function reservar() {
    if (!pub || estadoCuenta !== "VERIFICADO") return;
    setReservando(true);
    const r = await api("/api/reservas", {
      method: "POST",
      json: {
        publicacionId: pub.id,
        ventanaRetiroInicio: pub.ventanaInicio,
        ventanaRetiroFin: pub.ventanaFin,
      },
    });
    if (!r.ok) {
      notify(r.error || "No se pudo reservar.", "error");
      setReservando(false);
      return;
    }
    notify("¡Reserva confirmada! Pasá a retirar dentro del horario.", "success");
    router.push("/receptor/reservas");
    router.refresh();
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
        <p className="font-extrabold text-rose-950">Publicación no encontrada.</p>
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
              <p className="text-sm font-bold text-slate-700">{cant.referencia}</p>
            </div>
          </div>
          <EstadoPublicacionBadge estado={pub.estado} />
        </div>

        {pub.fotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
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
            <span>{lugarPublicacion(pub)}</span>
          </p>
          <p className="flex items-center gap-2 text-emerald-900">
            <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Ventana de retiro: {formatHora(pub.ventanaInicio)} – {formatHora(pub.ventanaFin)}
            </span>
          </p>
          <p className="text-slate-700">Comerciante: {pub.comerciante.nombre}</p>
        </div>

        <div className="mt-4">
          <AccesosContacto lat={pub.lat} lng={pub.lng} telefono={pub.comerciante.telefono} />
        </div>

        {pub.estado === "DISPONIBLE" && (
          <BloqueReserva
            estadoCuenta={estadoCuenta}
            motivoRechazo={motivoRechazo}
            reservando={reservando}
            onReservar={reservar}
          />
        )}

        <div className="mt-4 border-t border-slate-200 pt-3">
          <ReportarPublicacion publicacionId={pub.id} />
        </div>
      </div>
    </div>
  );
}

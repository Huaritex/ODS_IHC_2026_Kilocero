"use client";

import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import type { CantidadAproximada, CategoriaAlimento } from "@/lib/types";
import { CANTIDAD_MAP, CATEGORIA_MAP } from "@/lib/constants";
import { formatHora } from "@/lib/formato";
import { lugarPublicacion } from "@/lib/lugar";
import { getCountdownInfo } from "@/lib/explorar";

export interface PublicacionDisponible {
  id: string;
  categoria: CategoriaAlimento;
  cantidadAproximada: CantidadAproximada;
  descripcion: string | null;
  mercado: string;
  direccionTexto: string;
  lat: number;
  lng: number;
  ventanaInicio: string;
  ventanaFin: string;
  comerciante: {
    nombre: string;
    puesto: string | null;
  };
}

/** Tarjeta de un excedente disponible en la lista del receptor. */
export function PublicacionCard({
  pub,
  nowMs,
  mostrarDistancia,
}: {
  pub: PublicacionDisponible & { distanciaKm: number };
  nowMs: number;
  mostrarDistancia: boolean;
}) {
      const cat = CATEGORIA_MAP[pub.categoria];
      const cant = CANTIDAD_MAP[pub.cantidadAproximada];
      const countdown = getCountdownInfo(pub.ventanaFin, nowMs);
      return (
        <li
          key={pub.id}
          className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden="true">
                {cat.emoji}
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  {cat.label} · {cant.label}
                </h3>
                <p className="text-xs font-bold text-slate-700">
                  {cant.referencia} · {pub.comerciante.nombre}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center rounded-full border-2 px-2.5 py-0.5 text-xs font-extrabold ${countdown.classes}`}
            >
              {countdown.texto}
            </span>
          </div>

          {pub.descripcion && (
            <p className="mt-2 text-sm font-medium text-slate-800">
              {pub.descripcion}
            </p>
          )}

          <div className="mt-3 space-y-1 text-sm font-bold text-slate-800">
            <p className="flex items-center gap-1.5 text-slate-950">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {lugarPublicacion(pub)}
                {mostrarDistancia
                  ? ` · ~${pub.distanciaKm.toFixed(1)} km`
                  : ""}
              </span>
            </p>
            <p className="flex items-center gap-1.5 text-emerald-900">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Retiro: {formatHora(pub.ventanaInicio)} –{" "}
                {formatHora(pub.ventanaFin)}
              </span>
            </p>
          </div>

          <Link
            href={`/receptor/publicaciones/${pub.id}`}
            className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-sky-900 px-4 text-base font-extrabold text-white hover:bg-sky-950"
          >
            Ver detalle y reservar
          </Link>
        </li>
      );
}

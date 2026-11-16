"use client";

import { api } from "@/lib/api-client";
import { lugarPublicacion } from "@/lib/lugar";
import { formatHora } from "@/lib/formato";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { List, Map as MapIcon, Clock, MapPin, Navigation } from "lucide-react";
import type { CantidadAproximada, CategoriaAlimento } from "@/lib/types";
import {
  CANTIDAD_MAP,
  CATEGORIA_MAP,
  CATEGORIAS_ALIMENTO,
  CENTRO_SANTA_CRUZ,
  MERCADOS_SANTA_CRUZ,
} from "@/lib/constants";

const MapaExcedentes = dynamic(() => import("@/components/MapaExcedentes"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center sm:h-[380px] lg:h-[480px] justify-center rounded-2xl border-2 border-slate-900 bg-slate-200 font-bold text-slate-800">
      Cargando mapa de Santa Cruz...
    </div>
  ),
});

interface PublicacionDisponible {
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


function calcularDistanciaKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getCountdownInfo(ventanaFinIso: string, nowMs: number) {
  const diffMin = Math.round(
    (new Date(ventanaFinIso).getTime() - nowMs) / 60_000
  );
  if (diffMin <= 0) {
    return {
      texto: "Por cerrar",
      classes: "bg-rose-100 text-rose-950 border-rose-700",
    };
  }
  if (diffMin <= 15) {
    return {
      texto: `Cierra en ${diffMin} min`,
      classes: "bg-rose-100 text-rose-950 border-rose-700",
    };
  }
  if (diffMin <= 45) {
    return {
      texto: `Cierra en ${diffMin} min`,
      classes: "bg-amber-100 text-amber-950 border-amber-700",
    };
  }
  const horas = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return {
    texto: horas > 0 ? `Quedan ${horas}h ${mins}m` : `Quedan ${mins} min`,
    classes: "bg-emerald-100 text-emerald-950 border-emerald-700",
  };
}

export default function ReceptorExplorarPage() {
  const router = useRouter();
  const [vista, setVista] = useState<"lista" | "mapa">("lista");
  const [categoria, setCategoria] = useState<CategoriaAlimento | "TODAS">(
    "TODAS"
  );
  const [mercadoFiltro, setMercadoFiltro] = useState<string>("TODOS");
  const [miUbicacion, setMiUbicacion] = useState<{
    lat: number;
    lng: number;
    esGps: boolean;
  }>({ lat: CENTRO_SANTA_CRUZ.lat, lng: CENTRO_SANTA_CRUZ.lng, esGps: false });
  const [ordenarPorDistancia, setOrdenarPorDistancia] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [publicaciones, setPublicaciones] = useState<PublicacionDisponible[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const cargar = useCallback(async (cat: CategoriaAlimento | "TODAS") => {
    setLoading(true);
    setError(null);
    const qs = cat === "TODAS" ? "" : `?categoria=${cat}`;
    const r = await api<{ publicaciones: PublicacionDisponible[] }>(
      `/api/publicaciones${qs}`
    );
    if (r.ok && r.data) setPublicaciones(r.data.publicaciones || []);
    else setError("No pudimos cargar los excedentes disponibles.");
    setLoading(false);
  }, []);

  useEffect(() => {
    cargar(categoria);
  }, [categoria, cargar]);

  function activarCercania() {
    if (!ordenarPorDistancia && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMiUbicacion({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            esGps: true,
          });
          setOrdenarPorDistancia(true);
        },
        () => {
          // Fallback: usa centro de Santa Cruz
          setOrdenarPorDistancia(true);
        },
        { timeout: 4000 }
      );
    } else {
      setOrdenarPorDistancia((prev) => !prev);
    }
  }

  const filtradas = useMemo(() => {
    const base = publicaciones
      .filter((p) =>
        mercadoFiltro === "TODOS" ? true : p.mercado === mercadoFiltro
      )
      .map((p) => ({
        ...p,
        distanciaKm: calcularDistanciaKm(
          miUbicacion.lat,
          miUbicacion.lng,
          p.lat,
          p.lng
        ),
      }));

    if (ordenarPorDistancia) {
      return [...base].sort((a, b) => a.distanciaKm - b.distanciaKm);
    }
    return base;
  }, [publicaciones, mercadoFiltro, miUbicacion, ordenarPorDistancia]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-950">
            Excedentes disponibles
          </h2>
          <p className="text-sm font-semibold text-slate-700">
            {filtradas.length} disponible(s) en Santa Cruz
          </p>
        </div>

        <div
          role="group"
          aria-label="Cambiar vista entre lista y mapa"
          className="flex rounded-xl border-2 border-slate-900 bg-white p-1"
        >
          <button
            type="button"
            aria-pressed={vista === "lista"}
            onClick={() => setVista("lista")}
            className={`flex min-h-[48px] items-center gap-1.5 rounded-lg px-3.5 text-sm font-extrabold ${
              vista === "lista"
                ? "bg-slate-900 text-white"
                : "text-slate-900 hover:bg-slate-100"
            }`}
          >
            <List className="h-4 w-4" aria-hidden="true" />
            <span>Lista</span>
          </button>
          <button
            type="button"
            aria-pressed={vista === "mapa"}
            onClick={() => setVista("mapa")}
            className={`flex min-h-[48px] items-center gap-1.5 rounded-lg px-3.5 text-sm font-extrabold ${
              vista === "mapa"
                ? "bg-slate-900 text-white"
                : "text-slate-900 hover:bg-slate-100"
            }`}
          >
            <MapIcon className="h-4 w-4" aria-hidden="true" />
            <span>Mapa</span>
          </button>
        </div>
      </div>

      {/* Filtro por mercado + ordenar por cercanía */}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="filtro-mercado" className="sr-only">
          Filtrar por mercado
        </label>
        <select
          id="filtro-mercado"
          value={mercadoFiltro}
          onChange={(e) => setMercadoFiltro(e.target.value)}
          className="min-h-[48px] flex-1 rounded-xl border-2 border-slate-900 bg-white px-3 text-sm font-extrabold text-slate-950"
        >
          <option value="TODOS">Todos los mercados</option>
          {MERCADOS_SANTA_CRUZ.map((m) => (
            <option key={m.nombre} value={m.nombre}>
              {m.nombre}
            </option>
          ))}
        </select>

        <button
          type="button"
          aria-pressed={ordenarPorDistancia}
          onClick={activarCercania}
          className={`flex min-h-[48px] items-center gap-1.5 rounded-xl border-2 px-3.5 text-sm font-extrabold ${
            ordenarPorDistancia
              ? "border-sky-950 bg-sky-900 text-white"
              : "border-slate-900 bg-white text-slate-950 hover:bg-slate-100"
          }`}
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          <span>{ordenarPorDistancia ? "Más cercanos ✓" : "Por cercanía"}</span>
        </button>
      </div>

      {/* Filtros por categoría */}
      <div
        role="group"
        aria-label="Filtrar por categoría de alimento"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        <button
          type="button"
          aria-pressed={categoria === "TODAS"}
          onClick={() => setCategoria("TODAS")}
          className={`min-h-[48px] shrink-0 rounded-full border-2 px-4 text-sm font-extrabold ${
            categoria === "TODAS"
              ? "border-slate-950 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-900"
          }`}
        >
          Todas
        </button>
        {CATEGORIAS_ALIMENTO.map((cat) => (
          <button
            key={cat.value}
            type="button"
            aria-pressed={categoria === cat.value}
            onClick={() => setCategoria(cat.value)}
            className={`flex min-h-[48px] shrink-0 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-extrabold ${
              categoria === cat.value
                ? "border-sky-950 bg-sky-900 text-white"
                : "border-slate-300 bg-white text-slate-900"
            }`}
          >
            <span aria-hidden="true">{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border-2 border-rose-700 bg-rose-50 p-4 text-sm font-bold text-rose-950"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border-2 border-slate-300 bg-white p-6 text-center font-bold text-slate-700">
          Buscando excedentes cercanos...
        </div>
      ) : vista === "mapa" ? (
        <MapaExcedentes
          publicaciones={filtradas}
          onSelect={(id) => router.push(`/receptor/publicaciones/${id}`)}
        />
      ) : filtradas.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-400 bg-white p-6 text-center">
          <p className="text-lg font-extrabold text-slate-950">
            No hay excedentes con estos filtros ahora
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Probá seleccionando &ldquo;Todos los mercados&rdquo; o &ldquo;Todas&rdquo; las categorías.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtradas.map((pub) => {
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
                      {ordenarPorDistancia
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
          })}
        </ul>
      )}
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { calcularDistanciaKm } from "@/lib/explorar";
import type { CategoriaAlimento } from "@/lib/types";
import { CENTRO_SANTA_CRUZ } from "@/lib/constants";
import {
  FiltrosExplorar,
  type VistaExplorar,
} from "@/components/receptor/FiltrosExplorar";
import {
  PublicacionCard,
  type PublicacionDisponible,
} from "@/components/receptor/PublicacionCard";

const MapaExcedentes = dynamic(() => import("@/components/MapaExcedentes"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center sm:h-[380px] lg:h-[480px] justify-center rounded-2xl border-2 border-slate-900 bg-slate-200 font-bold text-slate-800">
      Cargando mapa de Santa Cruz...
    </div>
  ),
});

export default function ReceptorExplorarPage() {
  const router = useRouter();
  const [vista, setVista] = useState<VistaExplorar>("lista");
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
      <FiltrosExplorar
        total={filtradas.length}
        vista={vista}
        onVista={setVista}
        mercado={mercadoFiltro}
        onMercado={setMercadoFiltro}
        ordenarPorDistancia={ordenarPorDistancia}
        onCercania={activarCercania}
        categoria={categoria}
        onCategoria={setCategoria}
      />

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
          {filtradas.map((pub) => (
            <PublicacionCard
              key={pub.id}
              pub={pub}
              nowMs={nowMs}
              mostrarDistancia={ordenarPorDistancia}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

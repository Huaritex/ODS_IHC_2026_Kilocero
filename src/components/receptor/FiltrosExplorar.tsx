"use client";

import { List, Map as MapIcon, Navigation } from "lucide-react";
import type { CategoriaAlimento } from "@/lib/types";
import { CATEGORIAS_ALIMENTO, MERCADOS_SANTA_CRUZ } from "@/lib/constants";

export type VistaExplorar = "lista" | "mapa";

interface FiltrosExplorarProps {
  total: number;
  vista: VistaExplorar;
  onVista: (v: VistaExplorar) => void;
  mercado: string;
  onMercado: (m: string) => void;
  ordenarPorDistancia: boolean;
  onCercania: () => void;
  categoria: CategoriaAlimento | "TODAS";
  onCategoria: (c: CategoriaAlimento | "TODAS") => void;
}

/** Cabecera de Explorar: título, vista lista/mapa, filtros de mercado y categoría. */
export function FiltrosExplorar({
  total,
  vista,
  onVista,
  mercado,
  onMercado,
  ordenarPorDistancia,
  onCercania,
  categoria,
  onCategoria,
}: FiltrosExplorarProps) {
  return (
    <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-black text-slate-950">
          Excedentes disponibles
        </h2>
        <p className="text-sm font-semibold text-slate-700">
          {total} disponible(s) en Santa Cruz
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
          onClick={() => onVista("lista")}
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
          onClick={() => onVista("mapa")}
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
        value={mercado}
        onChange={(e) => onMercado(e.target.value)}
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
        onClick={onCercania}
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
        onClick={() => onCategoria("TODAS")}
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
          onClick={() => onCategoria(cat.value)}
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
    </>
  );
}

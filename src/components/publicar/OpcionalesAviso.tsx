"use client";

import { useState } from "react";
import { Camera, ChevronDown, ChevronUp } from "lucide-react";

/** Foto y nota opcionales, colapsadas para no frenar la publicación rápida. */
export function OpcionalesAviso({
  fotoUrl,
  descripcion,
  onFoto,
  onDescripcion,
}: {
  fotoUrl: string;
  descripcion: string;
  onFoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescripcion: (texto: string) => void;
}) {
  const [mostrarOpcionales, setMostrarOpcionales] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setMostrarOpcionales((v) => !v)}
        className="flex min-h-[48px] w-full items-center justify-between rounded-xl border-2 border-dashed border-slate-400 bg-white px-4 text-sm font-bold text-slate-800"
      >
        <span>
          {fotoUrl || descripcion
            ? "Foto / nota agregada ✓"
            : "+ Agregar foto o nota (opcional)"}
        </span>
        {mostrarOpcionales ? (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        )}
      </button>

      {mostrarOpcionales && (
        <div className="mt-2 space-y-3 rounded-2xl border-2 border-slate-300 bg-white p-3.5">
          <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-100 px-4 text-sm font-extrabold text-slate-950">
            <Camera className="h-5 w-5" aria-hidden="true" />
            <span>
              {fotoUrl ? "Foto cargada ✓ (cambiar)" : "Sacar o elegir foto"}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFoto}
              className="sr-only"
            />
          </label>
          <input
            aria-label="Nota corta opcional"
            value={descripcion}
            onChange={(e) => onDescripcion(e.target.value)}
            maxLength={140}
            placeholder="Nota corta (ej. 2 cajas de tomate maduro)"
            className="min-h-[48px] w-full rounded-xl border-2 border-slate-400 px-3 text-base"
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ToastProvider";

/** Enlace + formulario inline para reportar una publicación problemática. */
export function ReportarPublicacion({ publicacionId }: { publicacionId: string }) {
  const { notify } = useToast();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const r = await api(`/api/publicaciones/${publicacionId}`, {
      method: "PATCH",
      json: { accion: "REPORTAR", motivo: motivo || "Producto con problema reportado" },
    });
    setEnviando(false);
    if (!r.ok) return notify(r.error || "No se pudo enviar el reporte.", "error");
    notify("Reporte enviado al equipo administrador.", "info");
    setAbierto(false);
    setMotivo("");
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex min-h-[48px] items-center gap-1.5 text-sm font-bold text-rose-800 underline"
      >
        <Flag className="h-4 w-4" aria-hidden="true" />
        <span>Reportar problema con esta publicación</span>
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-2">
      <label htmlFor="motivo-reporte" className="block text-sm font-extrabold text-slate-950">
        Motivo del reporte
      </label>
      <input
        id="motivo-reporte"
        required
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Ej. Alimento en mal estado o puesto cerrado"
        className="min-h-[48px] w-full rounded-xl border-2 border-slate-900 px-3 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="min-h-[48px] flex-1 rounded-xl bg-rose-700 px-4 text-sm font-extrabold text-white"
        >
          {enviando ? "Enviando..." : "Enviar reporte"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="min-h-[48px] rounded-xl border-2 border-slate-900 px-4 text-sm font-bold"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

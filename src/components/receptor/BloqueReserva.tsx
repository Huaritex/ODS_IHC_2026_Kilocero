import { CheckCircle2, Lock } from "lucide-react";
import type { EstadoVerificacion } from "@/lib/types";

/** Botón de reservar si la cuenta está verificada; si no, aviso del motivo. */
export function BloqueReserva({
  estadoCuenta,
  motivoRechazo,
  reservando,
  onReservar,
}: {
  estadoCuenta: EstadoVerificacion;
  motivoRechazo: string | null;
  reservando: boolean;
  onReservar: () => void;
}) {
  if (estadoCuenta === "VERIFICADO") {
    return (
      <button
        type="button"
        disabled={reservando}
        onClick={onReservar}
        className="mt-6 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-5 text-lg font-black text-white hover:bg-emerald-900 disabled:opacity-60"
      >
        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        <span>{reservando ? "Reservando..." : "RESERVAR EXCEDENTE"}</span>
      </button>
    );
  }
  return (
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
  );
}

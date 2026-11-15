import {
  CheckCircle2,
  Clock,
  ArrowLeftRight,
  CircleDot,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import type { EstadoPublicacion, EstadoVerificacion } from "@/lib/types";
import {
  ESTADO_PUBLICACION_UI,
  ESTADO_VERIFICACION_UI,
} from "@/lib/constants";

const PUB_ICON: Record<EstadoPublicacion, typeof CircleDot> = {
  DISPONIBLE: CircleDot,
  RESERVADO: Clock,
  RETIRADO: ArrowLeftRight,
  CONFIRMADO: CheckCircle2,
  EXPIRADO: XCircle,
};

const VERIF_ICON: Record<EstadoVerificacion, typeof Clock> = {
  PENDIENTE: Clock,
  VERIFICADO: ShieldCheck,
  RECHAZADO: XCircle,
};

export function EstadoPublicacionBadge({
  estado,
}: {
  estado: EstadoPublicacion;
}) {
  const ui = ESTADO_PUBLICACION_UI[estado];
  const Icon = PUB_ICON[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${ui.classes}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{ui.label}</span>
    </span>
  );
}

export function EstadoVerificacionBadge({
  estado,
}: {
  estado: EstadoVerificacion;
}) {
  const ui = ESTADO_VERIFICACION_UI[estado];
  const Icon = VERIF_ICON[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-xs font-extrabold uppercase tracking-wide ${ui.classes}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{ui.label}</span>
    </span>
  );
}

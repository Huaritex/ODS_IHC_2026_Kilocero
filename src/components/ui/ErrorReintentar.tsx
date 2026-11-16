import { RefreshCw } from "lucide-react";

export function ErrorReintentar({
  mensaje,
  onRetry,
}: {
  mensaje: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-rose-800 bg-rose-50 p-4 text-sm font-bold text-rose-950"
    >
      <span>{mensaje}</span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-[48px] items-center gap-1.5 rounded-xl border-2 border-rose-800 bg-white px-4 text-sm font-extrabold"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Reintentar
      </button>
    </div>
  );
}

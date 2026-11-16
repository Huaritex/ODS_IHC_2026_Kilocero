import { Camera } from "lucide-react";

/** Vista previa, cambio y quitar foto de un aviso existente. */
export function FotoEditable({
  fotoActual,
  fotoNueva,
  quitar,
  onElegir,
  onQuitar,
}: {
  fotoActual: string | null;
  fotoNueva: string;
  quitar: boolean;
  onElegir: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onQuitar: (v: boolean) => void;
}) {
  const tiene = Boolean(fotoActual || fotoNueva);
  return (
    <div className="space-y-2">
      {(fotoNueva || (fotoActual && !quitar)) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fotoNueva || fotoActual || ""}
          alt="Foto del aviso"
          className="h-40 w-full rounded-2xl border-2 border-slate-900 object-cover"
        />
      )}
      <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-100 px-4 text-sm font-extrabold text-slate-950">
        <Camera className="h-5 w-5" aria-hidden="true" />
        <span>{tiene ? "Cambiar foto" : "Agregar foto"}</span>
        <input type="file" accept="image/*" capture="environment" onChange={onElegir} className="sr-only" />
      </label>
      {tiene && (
        <label className="flex min-h-[48px] cursor-pointer items-center gap-3 text-sm font-extrabold text-slate-950">
          <input
            type="checkbox"
            className="h-6 w-6 accent-rose-700"
            checked={quitar && !fotoNueva}
            disabled={Boolean(fotoNueva)}
            onChange={(e) => onQuitar(e.target.checked)}
          />
          Quitar la foto
        </label>
      )}
    </div>
  );
}

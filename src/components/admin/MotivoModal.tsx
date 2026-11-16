import { ConfirmModal } from "@/components/ui/ConfirmModal";

/** ConfirmModal con un campo de motivo editable (rechazo de receptor, suspensión de local). */
export function MotivoModal({
  id,
  target,
  title,
  description,
  confirmLabel,
  etiqueta,
  placeholder,
  motivo,
  onMotivo,
  loading,
  onConfirm,
  onCancel,
}: {
  id: string;
  target: unknown;
  title: string;
  description: string;
  confirmLabel: string;
  etiqueta: string;
  placeholder?: string;
  motivo: string;
  onMotivo: (v: string) => void;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmModal
      open={Boolean(target)}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <label htmlFor={id} className="mt-4 block text-sm font-extrabold text-slate-950">
        {etiqueta}
      </label>
      <textarea
        id={id}
        value={motivo}
        onChange={(e) => onMotivo(e.target.value)}
        maxLength={200}
        rows={3}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border-2 border-slate-900 bg-white px-3 py-2 text-base text-slate-950"
      />
    </ConfirmModal>
  );
}

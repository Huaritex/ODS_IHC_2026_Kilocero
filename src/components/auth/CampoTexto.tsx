import type { InputHTMLAttributes } from "react";

/** Etiqueta + input con el estilo de los formularios de autenticación. */
export function CampoTexto({
  id,
  label,
  ...input
}: { id: string; label: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-extrabold text-slate-950">
        {label}
      </label>
      <input
        id={id}
        {...input}
        className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 px-4 text-base"
      />
    </div>
  );
}

"use client";

import React, { useEffect, useRef } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  destructive = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      // Foco inicial en Cancelar por prevención de errores
      requestAnimationFrame(() => {
        cancelBtnRef.current?.focus();
      });
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onCancel();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled])"
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 sm:items-center"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-2xl"
      >
        <h2
          id="confirm-modal-title"
          className="text-xl font-extrabold text-slate-950"
        >
          {title}
        </h2>
        <p
          id="confirm-modal-description"
          className="mt-2 text-base text-slate-700 leading-relaxed"
        >
          {description}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`min-h-[48px] flex-1 rounded-xl px-5 py-3 text-base font-extrabold text-white transition disabled:opacity-60 ${
              destructive
                ? "bg-rose-700 hover:bg-rose-800"
                : "bg-emerald-800 hover:bg-emerald-900"
            }`}
          >
            {loading ? "Procesando..." : confirmLabel}
          </button>
          <button
            ref={cancelBtnRef}
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="min-h-[48px] flex-1 rounded-xl border-2 border-slate-900 bg-white px-5 py-3 text-base font-bold text-slate-950 hover:bg-slate-100 disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

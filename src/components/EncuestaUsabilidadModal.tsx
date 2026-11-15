"use client";

import React, { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { useToast } from "./ToastProvider";

export function EncuestaUsabilidadModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { notify } = useToast();
  const [facil, setFacil] = useState(5);
  const [util, setUtil] = useState(5);
  const [sending, setSending] = useState(false);

  const modalRef = useRef<HTMLFormElement | null>(null);
  const skipBtnRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => {
        skipBtnRef.current?.focus();
      });
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled])"
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!modalRef.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
          return;
        }
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
  }, [open, sending, onClose]);

  if (!open) return null;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("/api/metricas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "ENCUESTA_SUS",
          valor: facil,
          puntajeSecundario: util,
        }),
      });
      notify("¡Gracias! Tu opinión ayuda a mejorar Kilo Cero.", "success");
    } finally {
      setSending(false);
      onClose();
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="encuesta-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-4 sm:items-center"
    >
      <form
        ref={modalRef}
        onSubmit={enviar}
        className="w-full max-w-md rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-2xl"
      >
        <div className="flex items-center gap-2 text-emerald-900">
          <Star className="h-5 w-5" aria-hidden="true" />
          <h2 id="encuesta-title" className="text-lg font-black text-slate-950">
            ¿Cómo te fue con la entrega? (10 seg)
          </h2>
        </div>

        <div className="mt-4 space-y-4">
          <fieldset>
            <legend className="text-sm font-extrabold text-slate-950">
              1. ¿Qué tan fácil fue usar Kilo Cero? (1 = Difícil, 5 = Muy fácil)
            </legend>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={facil === n}
                  aria-label={`${n} de 5`}
                  onClick={() => setFacil(n)}
                  className={`min-h-[48px] rounded-xl border-2 text-base font-black ${
                    facil === n
                      ? "border-emerald-950 bg-emerald-800 text-white"
                      : "border-slate-300 bg-white text-slate-950"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-extrabold text-slate-950">
              2. ¿Resolvió lo que necesitabas hoy? (1 = Nada, 5 = Totalmente)
            </legend>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={util === n}
                  aria-label={`${n} de 5`}
                  onClick={() => setUtil(n)}
                  className={`min-h-[48px] rounded-xl border-2 text-base font-black ${
                    util === n
                      ? "border-emerald-950 bg-emerald-800 text-white"
                      : "border-slate-300 bg-white text-slate-950"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            ref={skipBtnRef}
            type="button"
            disabled={sending}
            onClick={onClose}
            className="min-h-[48px] flex-1 rounded-xl border-2 border-slate-900 bg-white text-sm font-bold text-slate-950"
          >
            Omitir
          </button>
          <button
            type="submit"
            disabled={sending}
            className="min-h-[48px] flex-1 rounded-xl bg-emerald-800 text-sm font-extrabold text-white hover:bg-emerald-900"
          >
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}

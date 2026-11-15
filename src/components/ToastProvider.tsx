"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  notify: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-4 right-4 left-4 z-[9999] flex flex-col items-end gap-2 pointer-events-none sm:left-auto sm:w-96"
      >
        {toasts.map((t) => {
          const styles =
            t.type === "success"
              ? "bg-emerald-950 text-white border-emerald-500"
              : t.type === "error"
                ? "bg-rose-950 text-white border-rose-400"
                : "bg-slate-900 text-white border-sky-400";
          const Icon =
            t.type === "success"
              ? CheckCircle2
              : t.type === "error"
                ? AlertTriangle
                : Info;

          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 shadow-lg ${styles}`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-sm font-semibold leading-snug">
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar notificación"
                className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-xl hover:bg-white/15"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import {
  flushOfflineQueue,
  getTotalPendingCount,
  QUEUE_UPDATED_EVENT,
} from "@/lib/offline-queue";
import { useToast } from "./ToastProvider";

export function ConnectionBanner() {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { notify } = useToast();

  const refreshCount = useCallback(() => {
    setPendingCount(getTotalPendingCount());
  }, []);

  const syncQueue = useCallback(async () => {
    const count = getTotalPendingCount();
    if (count === 0 || !navigator.onLine) return;
    setSyncing(true);
    const { enviadas, fallidas } = await flushOfflineQueue();
    setSyncing(false);
    refreshCount();
    if (enviadas > 0) {
      notify(
        `Se sincronizaron ${enviadas} operación(es) que estaban pendientes.`,
        "success"
      );
      window.dispatchEvent(new CustomEvent("kilocero:publicaciones-synced"));
    } else if (fallidas > 0) {
      notify(
        "Hay operaciones pendientes que no pudieron enviarse todavía.",
        "error"
      );
    }
  }, [notify, refreshCount]);

  useEffect(() => {
    setOnline(navigator.onLine);
    refreshCount();

    const handleOnline = () => {
      setOnline(true);
      syncQueue();
    };
    const handleOffline = () => {
      setOnline(false);
    };
    const handleQueueChange = () => {
      refreshCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(QUEUE_UPDATED_EVENT, handleQueueChange);

    if (navigator.onLine && getTotalPendingCount() > 0) {
      syncQueue();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(QUEUE_UPDATED_EVENT, handleQueueChange);
    };
  }, [refreshCount, syncQueue]);

  if (online && pendingCount === 0 && !syncing) {
    return (
      <div
        aria-live="polite"
        className="flex items-center justify-center gap-2 border-b border-slate-900 bg-emerald-900 px-3 py-1.5 text-xs font-extrabold text-white"
      >
        <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Conectado · Santa Cruz</span>
      </div>
    );
  }

  if (!online) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-center gap-2 border-b-2 border-slate-900 bg-amber-400 px-3 py-2 text-sm font-extrabold text-slate-950"
      >
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Sin señal de internet.{" "}
          {pendingCount > 0
            ? `Tenés ${pendingCount} operación(es) pendiente(s) de envío.`
            : "Lo que hagas se guardará para enviarse al volver la señal."}
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 border-b-2 border-slate-900 bg-sky-900 px-3 py-2 text-sm font-bold text-white"
    >
      <RefreshCw
        className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      <span>
        {syncing
          ? "Enviando operaciones pendientes..."
          : `${pendingCount} operación(es) pendiente(s) de envío`}
      </span>
      {!syncing && (
        <button
          type="button"
          onClick={syncQueue}
          className="min-h-[36px] rounded-lg border border-slate-900 bg-white px-3 py-1 text-xs font-extrabold text-slate-950 hover:bg-slate-100"
        >
          Reintentar ahora
        </button>
      )}
    </div>
  );
}

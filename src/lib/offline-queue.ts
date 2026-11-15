import type { CantidadAproximada, CategoriaAlimento } from "./types";

export interface QueuedPublicacion {
  localId: string;
  categoria: CategoriaAlimento;
  cantidadAproximada: CantidadAproximada;
  descripcion?: string;
  fotoUrl?: string;
  mercado: string;
  direccionTexto: string;
  lat: number;
  lng: number;
  ventanaInicio: string;
  ventanaFin: string;
  createdAt: string;
  intentos: number;
  ultimoError?: string;
}

export interface QueuedComercianteAction {
  localId: string;
  tipo: "CONFIRMAR_ENTREGA" | "CERRAR_PUBLICACION";
  targetId: string; // reservaId para confirmar, publicacionId para cerrar
  label: string;
  createdAt: string;
  intentos: number;
}

const PUB_STORAGE_KEY = "kilocero_offline_queue_v1";
const ACTION_STORAGE_KEY = "kilocero_offline_actions_v1";
export const QUEUE_UPDATED_EVENT = "kilocero:queue-updated";

function emitQueueUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(QUEUE_UPDATED_EVENT));
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 6000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function getOfflineQueue(): QueuedPublicacion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PUB_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(items: QueuedPublicacion[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(PUB_STORAGE_KEY, JSON.stringify(items));
    emitQueueUpdated();
    return true;
  } catch {
    // Si QuotaExceededError por fotos Base64, reintentar quitando fotoUrl del más reciente
    try {
      const stripped = items.map((item, idx) =>
        idx === 0 ? { ...item, fotoUrl: undefined } : item
      );
      window.localStorage.setItem(PUB_STORAGE_KEY, JSON.stringify(stripped));
      emitQueueUpdated();
      return true;
    } catch {
      return false;
    }
  }
}

export function enqueuePublicacion(
  item: Omit<QueuedPublicacion, "localId" | "createdAt" | "intentos">
): QueuedPublicacion {
  const current = getOfflineQueue();
  const nuevo: QueuedPublicacion = {
    ...item,
    localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    intentos: 0,
  };
  saveOfflineQueue([nuevo, ...current]);
  return nuevo;
}

export function removeQueuedPublicacion(localId: string) {
  const current = getOfflineQueue();
  saveOfflineQueue(current.filter((item) => item.localId !== localId));
}

export function getOfflineActions(): QueuedComercianteAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACTION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOfflineActions(actions: QueuedComercianteAction[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTION_STORAGE_KEY, JSON.stringify(actions));
    emitQueueUpdated();
  } catch {
    // Ignorar si storage lleno
  }
}

export function enqueueComercianteAction(
  tipo: QueuedComercianteAction["tipo"],
  targetId: string,
  label: string
): QueuedComercianteAction {
  const current = getOfflineActions().filter(
    (a) => !(a.tipo === tipo && a.targetId === targetId)
  );
  const nueva: QueuedComercianteAction = {
    localId: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    tipo,
    targetId,
    label,
    createdAt: new Date().toISOString(),
    intentos: 0,
  };
  saveOfflineActions([nueva, ...current]);
  return nueva;
}

export function getTotalPendingCount(): number {
  return getOfflineQueue().length + getOfflineActions().length;
}

export async function flushOfflineQueue(): Promise<{
  enviadas: number;
  fallidas: number;
}> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { enviadas: 0, fallidas: getTotalPendingCount() };
  }

  let enviadas = 0;

  // 1. Enviar publicaciones en cola
  const queue = getOfflineQueue();
  if (queue.length > 0) {
    const restantes: QueuedPublicacion[] = [];
    for (const item of queue) {
      try {
        const res = await fetchWithTimeout(
          "/api/publicaciones",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              categoria: item.categoria,
              cantidadAproximada: item.cantidadAproximada,
              descripcion: item.descripcion,
              fotoUrl: item.fotoUrl,
              mercado: item.mercado,
              direccionTexto: item.direccionTexto,
              lat: item.lat,
              lng: item.lng,
              ventanaInicio: item.ventanaInicio,
              ventanaFin: item.ventanaFin,
            }),
          },
          6000
        );

        if (res.ok) {
          enviadas += 1;
        } else {
          const data = await res.json().catch(() => ({}));
          restantes.push({
            ...item,
            intentos: item.intentos + 1,
            ultimoError: data.error || `Error HTTP ${res.status}`,
          });
        }
      } catch {
        restantes.push({
          ...item,
          intentos: item.intentos + 1,
          ultimoError: "Sin conexión al servidor",
        });
      }
    }
    saveOfflineQueue(restantes);
  }

  // 2. Enviar acciones pendientes (confirmar entrega / cerrar publicación)
  const actions = getOfflineActions();
  if (actions.length > 0) {
    const accionesRestantes: QueuedComercianteAction[] = [];
    for (const act of actions) {
      try {
        const res =
          act.tipo === "CONFIRMAR_ENTREGA"
            ? await fetchWithTimeout(
                `/api/reservas/${act.targetId}/confirmar`,
                { method: "POST" },
                6000
              )
            : await fetchWithTimeout(
                `/api/publicaciones/${act.targetId}`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ accion: "EXPIRAR" }),
                },
                6000
              );

        if (res.ok || res.status === 400 || res.status === 404) {
          // 400/404 significa que ya se procesó o cambió de estado en el servidor
          if (res.ok) enviadas += 1;
        } else {
          accionesRestantes.push({ ...act, intentos: act.intentos + 1 });
        }
      } catch {
        accionesRestantes.push({ ...act, intentos: act.intentos + 1 });
      }
    }
    saveOfflineActions(accionesRestantes);
  }

  return { enviadas, fallidas: getTotalPendingCount() };
}

/**
 * Capa mínima de acceso a la API para el frontend.
 * Centraliza fetch + JSON + manejo de errores para que las páginas no repitan
 * lógica de red: siempre devuelve { ok, status, data, error } y nunca lanza.
 */
export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

export async function api<T = unknown>(
  url: string,
  init: Omit<RequestInit, "body"> & { json?: unknown } = {}
): Promise<ApiResult<T>> {
  const { json, headers, ...rest } = init;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      ...rest,
      headers: {
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    });
    const data = (await res.json().catch(() => null)) as
      | (T & { error?: string })
      | null;
    return {
      ok: res.ok,
      status: res.status,
      data: res.ok ? data : null,
      error: res.ok ? null : (data?.error ?? "No se pudo completar la acción."),
    };
  } catch {
    return { ok: false, status: 0, data: null, error: "Sin conexión con el servidor." };
  }
}

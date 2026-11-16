"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";

/**
 * Hook de lectura para listados del panel admin: pide `url`, expone
 * { data, loading, error, recargar } y nunca lanza. Evita repetir en cada
 * página el trio useState(loading/error/datos) + useEffect + try/catch.
 */
export function useCarga<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const recargar = useCallback(async () => {
    setError(false);
    const r = await api<T>(url);
    if (r.ok && r.data) setData(r.data);
    else setError(true);
    setLoading(false);
  }, [url]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const reintentar = useCallback(() => {
    setLoading(true);
    return recargar();
  }, [recargar]);

  return { data, loading, error, recargar, reintentar };
}

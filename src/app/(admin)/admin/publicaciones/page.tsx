"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { useCarga } from "@/hooks/useCarga";
import { FiltroTabs } from "@/components/ui/FiltroTabs";
import { ErrorReintentar } from "@/components/ui/ErrorReintentar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ToastProvider";
import { EncabezadoAdmin } from "@/components/admin/EncabezadoAdmin";
import { ListadoAdmin } from "@/components/admin/ListadoAdmin";
import {
  PublicacionCard,
  PublicacionFila,
  type PublicacionItemProps,
} from "@/components/admin/publicaciones/PublicacionItem";
import type { AdminPubRow } from "@/components/admin/tipos";

type Filtro = "REPORTADAS" | "OCULTAS" | "TODAS";
type Accion = "OCULTAR" | "RESTAURAR" | "DESCARTAR_REPORTE";

const FILTROS = [
  ["REPORTADAS", "Reportadas"],
  ["OCULTAS", "Ocultas"],
  ["TODAS", "Todas"],
] as const;

const COLUMNAS = [
  { label: "Excedente" },
  { label: "Comerciante / Lugar" },
  { label: "Estado / Reporte" },
  { label: "Acciones", derecha: true },
];

export default function AdminPublicacionesPage() {
  const { notify } = useToast();
  const { data, loading, error, recargar, reintentar } = useCarga<{
    publicaciones: AdminPubRow[];
  }>("/api/admin/publicaciones");
  const publicaciones = useMemo(() => data?.publicaciones ?? [], [data]);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [hideTarget, setHideTarget] = useState<AdminPubRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminPubRow | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("TODAS");

  // Los enlaces desde "Locales" llegan con ?filtro=reportadas|ocultas
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("filtro");
    if (q === "reportadas") setFiltro("REPORTADAS");
    if (q === "ocultas") setFiltro("OCULTAS");
  }, []);

  const esReportada = (p: AdminPubRow) => p.reportada && !p.ocultaPorAdmin;
  const conteo = useMemo(
    () => ({
      REPORTADAS: publicaciones.filter(esReportada).length,
      OCULTAS: publicaciones.filter((p) => p.ocultaPorAdmin).length,
      TODAS: publicaciones.length,
    }),
    [publicaciones]
  );
  const visibles = useMemo(() => {
    if (filtro === "REPORTADAS") return publicaciones.filter(esReportada);
    if (filtro === "OCULTAS") return publicaciones.filter((p) => p.ocultaPorAdmin);
    return publicaciones;
  }, [publicaciones, filtro]);

  async function moderar(id: string, accion: Accion) {
    setBusyId(id);
    const r = await api(`/api/admin/publicaciones/${id}`, {
      method: "PATCH",
      json: { accion },
    });
    setBusyId(null);
    if (!r.ok) return notify("No se pudo moderar la publicación.", "error");
    notify(
      accion === "OCULTAR"
        ? "Publicación ocultada por moderación."
        : "Publicación actualizada.",
      "info"
    );
    setHideTarget(null);
    await recargar();
  }

  async function eliminar(p: AdminPubRow) {
    setBusyId(p.id);
    const r = await api(`/api/admin/publicaciones/${p.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!r.ok) return notify(r.error ?? "No se pudo eliminar.", "error");
    notify("Publicación eliminada.", "info");
    setDeleteTarget(null);
    await recargar();
  }

  const itemProps = (p: AdminPubRow): PublicacionItemProps => ({
    p,
    busy: busyId === p.id,
    onOcultar: () => setHideTarget(p),
    onRestaurar: () => moderar(p.id, "RESTAURAR"),
    onDescartar: () => moderar(p.id, "DESCARTAR_REPORTE"),
    onEliminar: () => setDeleteTarget(p),
  });

  return (
    <div className="space-y-4">
      <EncabezadoAdmin
        titulo="Moderación de publicaciones"
        descripcion="Las publicaciones reportadas aparecen primero para revisión rápida."
      />

      <FiltroTabs
        label="Filtrar publicaciones"
        opciones={FILTROS}
        value={filtro}
        conteo={conteo}
        onChange={setFiltro}
      />

      {error && <ErrorReintentar mensaje="No se pudo cargar el listado." onRetry={reintentar} />}

      <ListadoAdmin
        caption="Listado de publicaciones de excedentes y estado de moderación"
        columnas={COLUMNAS}
        cargando={loading}
        vacio={visibles.length === 0}
        mensajeCarga="Cargando publicaciones..."
        mensajeVacio="No hay publicaciones en esta vista."
        tarjetas={visibles.map((p) => (
          <PublicacionCard key={p.id} {...itemProps(p)} />
        ))}
        filas={visibles.map((p) => (
          <PublicacionFila key={p.id} {...itemProps(p)} />
        ))}
      />

      <ConfirmModal
        open={Boolean(hideTarget)}
        title="¿Ocultar esta publicación?"
        description="Dejará de mostrarse a los comedores y receptores."
        confirmLabel="Sí, ocultar"
        loading={Boolean(busyId)}
        onConfirm={() => hideTarget && moderar(hideTarget.id, "OCULTAR")}
        onCancel={() => setHideTarget(null)}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="¿Eliminar definitivamente?"
        description="Se borra la publicación y se cancelan sus reservas activas. Queda registrado en la auditoría."
        confirmLabel="Sí, eliminar"
        loading={Boolean(busyId)}
        onConfirm={() => deleteTarget && eliminar(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

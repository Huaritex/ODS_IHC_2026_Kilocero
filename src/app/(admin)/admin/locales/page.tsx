"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { useCarga } from "@/hooks/useCarga";
import { ErrorReintentar } from "@/components/ui/ErrorReintentar";
import { useToast } from "@/components/ToastProvider";
import { EncabezadoAdmin } from "@/components/admin/EncabezadoAdmin";
import { ListadoAdmin } from "@/components/admin/ListadoAdmin";
import { MotivoModal } from "@/components/admin/MotivoModal";
import { FiltrosLocales } from "@/components/admin/locales/FiltrosLocales";
import {
  LocalCard,
  LocalFila,
  type LocalItemProps,
} from "@/components/admin/locales/LocalItem";
import type { LocalRow } from "@/components/admin/tipos";

const COLUMNAS = [
  { label: "Local" },
  { label: "Contacto" },
  { label: "Publicados", derecha: true },
  { label: "Activos", derecha: true },
  { label: "Entregas", derecha: true },
  { label: "Kg", derecha: true },
  { label: "Reportes" },
  { label: "Acciones", derecha: true },
];

export default function AdminLocalesPage() {
  const { notify } = useToast();
  const { data, loading, error, recargar, reintentar } = useCarga<{
    locales: LocalRow[];
  }>("/api/admin/comerciantes");
  const locales = useMemo(() => data?.locales ?? [], [data]);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [target, setTarget] = useState<LocalRow | null>(null);
  const [motivo, setMotivo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [mercado, setMercado] = useState("TODOS");

  async function cambiarEstado(l: LocalRow, accion: "SUSPENDER" | "REACTIVAR") {
    setBusyId(l.id);
    const r = await api(`/api/admin/comerciantes/${l.id}`, {
      method: "PATCH",
      json: { accion, motivo: motivo.trim() },
    });
    setBusyId(null);
    if (!r.ok) return notify("No se pudo actualizar el local.", "error");
    notify(
      accion === "SUSPENDER"
        ? "Local suspendido. Sus avisos quedaron ocultos."
        : "Local reactivado.",
      accion === "SUSPENDER" ? "info" : "success"
    );
    setTarget(null);
    setMotivo("");
    await recargar();
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return locales.filter((l) => {
      if (mercado !== "TODOS" && l.mercado !== mercado) return false;
      if (!q) return true;
      return [l.nombre, l.email, l.puesto, l.mercado]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [locales, busqueda, mercado]);

  const itemProps = (l: LocalRow): LocalItemProps => ({
    l,
    busy: busyId === l.id,
    onSuspender: () => setTarget(l),
    onReactivar: () => cambiarEstado(l, "REACTIVAR"),
  });

  return (
    <div className="space-y-4">
      <EncabezadoAdmin
        titulo="Locales y comerciantes"
        descripcion="Actividad de cada puesto: cuánto publica, cuánto se rescata y si acumula reportes."
      />

      <FiltrosLocales
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        mercado={mercado}
        onMercado={setMercado}
      />

      <p className="text-xs font-bold text-slate-700" aria-live="polite">
        {loading ? "Cargando..." : `${filtrados.length} local(es)`}
      </p>

      {error && <ErrorReintentar mensaje="No se pudo cargar el listado." onRetry={reintentar} />}

      <ListadoAdmin
        caption="Locales de comerciantes y su actividad de rescate"
        columnas={COLUMNAS}
        cargando={loading}
        vacio={!error && filtrados.length === 0}
        mensajeCarga="Cargando locales..."
        mensajeVacio="No hay locales que coincidan."
        tarjetas={filtrados.map((l) => (
          <LocalCard key={l.id} {...itemProps(l)} />
        ))}
        filas={filtrados.map((l) => (
          <LocalFila key={l.id} {...itemProps(l)} />
        ))}
      />

      <MotivoModal
        id="motivo-suspension"
        target={target}
        title="¿Suspender este local?"
        description={`${target ? target.puesto || target.nombre : ""} no podrá ingresar ni publicar. Sus avisos activos se ocultarán y las reservas pendientes se cancelarán.`}
        confirmLabel="Sí, suspender"
        etiqueta="Motivo (visible para el comerciante)"
        motivo={motivo}
        onMotivo={setMotivo}
        loading={Boolean(busyId)}
        onConfirm={() => target && cambiarEstado(target, "SUSPENDER")}
        onCancel={() => {
          setTarget(null);
          setMotivo("");
        }}
      />
    </div>
  );
}

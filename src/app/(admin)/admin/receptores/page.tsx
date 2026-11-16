"use client";

import { useMemo, useState } from "react";
import { CheckCheck } from "lucide-react";
import { api } from "@/lib/api-client";
import { useCarga } from "@/hooks/useCarga";
import { FiltroTabs } from "@/components/ui/FiltroTabs";
import { ErrorReintentar } from "@/components/ui/ErrorReintentar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ToastProvider";
import { EncabezadoAdmin } from "@/components/admin/EncabezadoAdmin";
import { ListadoAdmin } from "@/components/admin/ListadoAdmin";
import { MotivoModal } from "@/components/admin/MotivoModal";
import { BotonAccion } from "@/components/admin/BotonAccion";
import {
  ReceptorCard,
  ReceptorFila,
  type ReceptorItemProps,
} from "@/components/admin/receptores/ReceptorItem";
import { nombreReceptor } from "@/components/admin/receptores/ReceptorParts";
import type { ReceptorRow } from "@/components/admin/tipos";

type Filtro = "PENDIENTE" | "VERIFICADO" | "RECHAZADO" | "TODOS";

const FILTROS = [
  ["PENDIENTE", "Pendientes"],
  ["VERIFICADO", "Verificados"],
  ["RECHAZADO", "Rechazados"],
  ["TODOS", "Todos"],
] as const;

const COLUMNAS = [
  { label: "Organización" },
  { label: "Responsable / Contacto" },
  { label: "Estado" },
  { label: "Acciones", derecha: true },
];

export default function AdminReceptoresPage() {
  const { notify } = useToast();
  const { data, loading, error, recargar, reintentar } = useCarga<{
    receptores: ReceptorRow[];
  }>("/api/admin/receptores");
  const receptores = useMemo(() => data?.receptores ?? [], [data]);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ReceptorRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReceptorRow | null>(null);
  const [motivo, setMotivo] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [batchOpen, setBatchOpen] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("PENDIENTE");

  async function decidir(id: string, decision: "VERIFICADO" | "RECHAZADO") {
    setBusyId(id);
    const r = await api(`/api/admin/receptores/${id}`, {
      method: "PATCH",
      json: {
        decision,
        motivoRechazo:
          decision === "RECHAZADO"
            ? motivo.trim() || "Documentación o datos de contacto no verificables"
            : undefined,
      },
    });
    setBusyId(null);
    if (!r.ok) return notify("No se pudo actualizar el estado.", "error");
    notify(
      decision === "VERIFICADO"
        ? "Receptor aprobado. Ya puede reservar."
        : "Solicitud rechazada.",
      decision === "VERIFICADO" ? "success" : "info"
    );
    setRejectTarget(null);
    setMotivo("");
    await recargar();
  }

  async function eliminar(r: ReceptorRow) {
    setBusyId(r.id);
    const res = await api(`/api/admin/receptores/${r.id}`, { method: "DELETE" });
    setBusyId(null);
    setDeleteTarget(null);
    if (!res.ok) return notify(res.error ?? "No se pudo eliminar.", "error");
    notify("Receptor eliminado.", "info");
    await recargar();
  }

  async function aprobarLote() {
    setBusyId("lote");
    const r = await api<{ aprobados: number }>("/api/admin/receptores", {
      method: "PATCH",
      json: { ids: Array.from(sel) },
    });
    setBusyId(null);
    if (!r.ok || !r.data) return notify("No se pudo aprobar la selección.", "error");
    notify(`${r.data.aprobados} receptor(es) aprobado(s).`, "success");
    setSel(new Set());
    setBatchOpen(false);
    await recargar();
  }

  function toggleSel(id: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  const conteo = useMemo(
    () => ({
      PENDIENTE: receptores.filter((r) => r.estadoVerificacion === "PENDIENTE").length,
      VERIFICADO: receptores.filter((r) => r.estadoVerificacion === "VERIFICADO").length,
      RECHAZADO: receptores.filter((r) => r.estadoVerificacion === "RECHAZADO").length,
      TODOS: receptores.length,
    }),
    [receptores]
  );
  const visibles = useMemo(
    () =>
      filtro === "TODOS"
        ? receptores
        : receptores.filter((r) => r.estadoVerificacion === filtro),
    [receptores, filtro]
  );
  const aprobables = visibles.filter((r) => r.estadoVerificacion !== "VERIFICADO");
  const selVisibles = aprobables.filter((r) => sel.has(r.id));

  const itemProps = (r: ReceptorRow): ReceptorItemProps => ({
    r,
    seleccionado: sel.has(r.id),
    busy: busyId === r.id,
    onToggle: () => toggleSel(r.id),
    onAprobar: () => decidir(r.id, "VERIFICADO"),
    onEliminar: () => setDeleteTarget(r),
    onRechazar: () => setRejectTarget(r),
  });

  return (
    <div className="space-y-4">
      <EncabezadoAdmin
        titulo="Verificación de receptores"
        descripcion="Aprobá o rechazá comedores, hogares y ONGs antes de que reserven."
      />

      <FiltroTabs
        label="Filtrar por estado"
        opciones={FILTROS}
        value={filtro}
        conteo={conteo}
        onChange={setFiltro}
      />

      {error && <ErrorReintentar mensaje="No se pudo cargar el listado." onRetry={reintentar} />}

      {aprobables.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-slate-900 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-h-[48px] cursor-pointer items-center gap-3 text-sm font-extrabold text-slate-950">
            <input
              type="checkbox"
              className="h-6 w-6 accent-emerald-800"
              checked={selVisibles.length === aprobables.length}
              onChange={(e) =>
                setSel(e.target.checked ? new Set(aprobables.map((r) => r.id)) : new Set())
              }
            />
            Seleccionar todos ({aprobables.length})
          </label>
          <BotonAccion
            icono={CheckCheck}
            variante="aprobar"
            disabled={selVisibles.length === 0 || busyId === "lote"}
            onClick={() => setBatchOpen(true)}
          >
            Aprobar seleccionados ({selVisibles.length})
          </BotonAccion>
        </div>
      )}

      <ListadoAdmin
        caption="Lista de organizaciones receptoras y su estado de verificación"
        columnas={COLUMNAS}
        cargando={loading}
        vacio={visibles.length === 0}
        mensajeCarga="Cargando receptores..."
        mensajeVacio="No hay receptores en este estado."
        tarjetas={visibles.map((r) => (
          <ReceptorCard key={r.id} {...itemProps(r)} />
        ))}
        filas={visibles.map((r) => (
          <ReceptorFila key={r.id} {...itemProps(r)} />
        ))}
      />

      <MotivoModal
        id="motivo-rechazo"
        target={rejectTarget}
        title="¿Rechazar solicitud?"
        description={`Vas a rechazar a ${rejectTarget ? nombreReceptor(rejectTarget) : ""}. No podrá reservar excedentes mientras esté rechazada.`}
        confirmLabel="Sí, rechazar"
        etiqueta="Motivo (lo verá el receptor)"
        placeholder="Ej. No pudimos verificar el teléfono de contacto"
        motivo={motivo}
        onMotivo={setMotivo}
        loading={Boolean(busyId)}
        onConfirm={() => rejectTarget && decidir(rejectTarget.id, "RECHAZADO")}
        onCancel={() => {
          setRejectTarget(null);
          setMotivo("");
        }}
      />

      <ConfirmModal
        open={batchOpen}
        title="¿Aprobar seleccionados?"
        description={`Se aprobarán ${selVisibles.length} receptor(es) y podrán reservar excedentes de inmediato.`}
        confirmLabel="Sí, aprobar"
        destructive={false}
        loading={busyId === "lote"}
        onConfirm={aprobarLote}
        onCancel={() => setBatchOpen(false)}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="¿Eliminar este receptor?"
        description={`Se borra la cuenta de ${deleteTarget ? nombreReceptor(deleteTarget) : ""}. Si tiene entregas o reservas activas no se podrá eliminar: en ese caso rechazalo.`}
        confirmLabel="Sí, eliminar"
        loading={Boolean(busyId)}
        onConfirm={() => deleteTarget && eliminar(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

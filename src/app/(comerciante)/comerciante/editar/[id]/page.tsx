"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import type { CantidadAproximada, CategoriaAlimento } from "@/lib/types";
import { formatHora } from "@/lib/formato";
import { SelectorCategoria } from "@/components/publicar/SelectorCategoria";
import { SelectorCantidad } from "@/components/publicar/SelectorCantidad";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ToastProvider";

interface Pub {
  id: string;
  categoria: CategoriaAlimento;
  cantidadAproximada: CantidadAproximada;
  descripcion: string | null;
  mercado: string;
  direccionTexto: string;
  fotoUrl: string | null;
  ventanaFin: string;
  estado: string;
}

const EXTENSIONES = [
  { min: 0, label: "Sin cambios" },
  { min: 30, label: "+30 min" },
  { min: 60, label: "+1 hora" },
  { min: 120, label: "+2 horas" },
];


export default function EditarPublicacionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useToast();

  const [pub, setPub] = useState<Pub | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<CategoriaAlimento | null>(null);
  const [cantidad, setCantidad] = useState<CantidadAproximada | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [quitarFoto, setQuitarFoto] = useState(false);
  const [extender, setExtender] = useState(0);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await api<{ publicacion: Pub }>(`/api/publicaciones/${id}`);
      if (!r.ok || !r.data) {
        setErrorCarga(r.error);
      } else if (r.data.publicacion.estado !== "DISPONIBLE") {
        setErrorCarga("Solo se pueden editar avisos que siguen disponibles.");
      } else {
        const p = r.data.publicacion;
        setPub(p);
        setCategoria(p.categoria);
        setCantidad(p.cantidadAproximada);
        setDescripcion(p.descripcion ?? "");
        setDireccion(p.direccionTexto);
      }
      setCargando(false);
    })();
  }, [id]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!pub || !categoria || !cantidad) return;
    setGuardando(true);

    const cambios: Record<string, unknown> = {
      accion: "EDITAR",
      categoria,
      cantidadAproximada: cantidad,
      descripcion: descripcion.trim(),
      direccionTexto: direccion.trim(),
    };
    if (extender > 0) {
      const base = Math.max(new Date(pub.ventanaFin).getTime(), Date.now());
      cambios.ventanaFin = new Date(base + extender * 60_000).toISOString();
    }
    if (quitarFoto) cambios.fotoUrl = null;

    const r = await api(`/api/publicaciones/${id}`, { method: "PATCH", json: cambios });
    setGuardando(false);
    if (!r.ok) {
      notify(r.error ?? "No se pudo guardar.", "error");
      return;
    }
    notify("Aviso actualizado.", "success");
    router.push("/comerciante");
    router.refresh();
  }

  if (cargando) {
    return (
      <p className="rounded-2xl border-2 border-slate-900 bg-white p-5 text-center font-bold">
        Cargando aviso...
      </p>
    );
  }

  if (errorCarga || !pub) {
    return (
      <div role="alert" className="space-y-3 rounded-2xl border-2 border-rose-800 bg-rose-50 p-5">
        <p className="font-bold text-rose-950">{errorCarga ?? "Aviso no encontrado."}</p>
        <Link
          href="/comerciante"
          className="inline-flex min-h-[48px] items-center rounded-xl border-2 border-slate-900 bg-white px-4 text-sm font-extrabold"
        >
          Volver a mis avisos
        </Link>
      </div>
    );
  }

  const cambioListo =
    categoria !== null && cantidad !== null && direccion.trim().length > 0;

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div>
        <Link
          href="/comerciante"
          className="inline-flex min-h-[48px] items-center gap-1.5 text-sm font-bold text-slate-700 underline underline-offset-4"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a mis avisos
        </Link>
        <h2 className="text-xl font-black text-slate-950">Editar aviso</h2>
        <p className="text-xs font-bold text-slate-700">
          Retiro hasta las {formatHora(pub.ventanaFin)}. Solo se puede editar mientras siga disponible.
        </p>
      </div>

      <SelectorCategoria legend="Alimento" value={categoria} onChange={setCategoria} />

      <SelectorCantidad legend="Cantidad aproximada" value={cantidad} onChange={setCantidad} />

      <fieldset>
        <legend className="text-sm font-black uppercase tracking-wide text-slate-950">
          Extender hora de retiro
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EXTENSIONES.map((x) => (
            <button
              key={x.min}
              type="button"
              aria-pressed={extender === x.min}
              onClick={() => setExtender(x.min)}
              className={`min-h-[48px] rounded-xl border-2 px-2 text-sm font-extrabold ${
                extender === x.min
                  ? "border-emerald-950 bg-emerald-100 text-emerald-950"
                  : "border-slate-300 bg-white text-slate-900 hover:border-slate-600"
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="ubicacion" className="text-sm font-black uppercase tracking-wide text-slate-950">
          Ubicación (puesto o pasillo)
        </label>
        <input
          id="ubicacion"
          value={direccion}
          maxLength={120}
          onChange={(e) => setDireccion(e.target.value)}
          className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 px-3 text-base"
        />
        <p className="mt-1 text-xs font-bold text-slate-600">
          Es lo que verán los comedores. Mercado: {pub.mercado}.
        </p>
      </div>

      <div>
        <label htmlFor="nota" className="text-sm font-black uppercase tracking-wide text-slate-950">
          Nota corta (opcional)
        </label>
        <input
          id="nota"
          value={descripcion}
          maxLength={140}
          onChange={(e) => setDescripcion(e.target.value)}
          className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 px-3 text-base"
        />
        <p className="mt-1 text-right text-xs font-bold text-slate-600">{descripcion.length}/140</p>
      </div>

      {pub.fotoUrl && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pub.fotoUrl}
            alt="Foto actual del aviso"
            className={`h-40 w-full rounded-2xl border-2 border-slate-900 object-cover ${quitarFoto ? "opacity-40" : ""}`}
          />
          <label className="flex min-h-[48px] cursor-pointer items-center gap-3 text-sm font-extrabold text-slate-950">
            <input
              type="checkbox"
              className="h-6 w-6 accent-rose-700"
              checked={quitarFoto}
              onChange={(e) => setQuitarFoto(e.target.checked)}
            />
            Quitar la foto
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={guardando || !cambioListo}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-950 bg-emerald-800 px-6 text-lg font-black text-white shadow-md hover:bg-emerald-900 disabled:opacity-60"
      >
        <Save className="h-5 w-5" aria-hidden="true" />
        <span>{guardando ? "Guardando..." : "GUARDAR CAMBIOS"}</span>
      </button>
    </form>
  );
}

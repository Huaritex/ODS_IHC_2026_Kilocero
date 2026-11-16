"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Send,
  Camera,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import type { CantidadAproximada, CategoriaAlimento } from "@/lib/types";
import { MERCADOS_SANTA_CRUZ } from "@/lib/constants";
import { formatHora } from "@/lib/formato";
import { calcularVentana, VENTANAS_RAPIDAS } from "@/lib/ventanas";
import { comprimirFoto } from "@/lib/foto-cliente";
import { SelectorCategoria } from "@/components/publicar/SelectorCategoria";
import { SelectorCantidad } from "@/components/publicar/SelectorCantidad";
import { enqueuePublicacion, fetchWithTimeout } from "@/lib/offline-queue";
import { useToast } from "@/components/ToastProvider";

const horaDe = formatHora;

export default function PublicarExcedentePage() {
  const router = useRouter();
  const { notify } = useToast();

  const [categoria, setCategoria] = useState<CategoriaAlimento | null>(null);
  const [cantidad, setCantidad] = useState<CantidadAproximada | null>(null);
  const [mercado, setMercado] = useState(MERCADOS_SANTA_CRUZ[0].nombre);
  const [direccionTexto, setDireccionTexto] = useState(
    MERCADOS_SANTA_CRUZ[0].nombre
  );
  const [coords, setCoords] = useState({
    lat: MERCADOS_SANTA_CRUZ[0].lat,
    lng: MERCADOS_SANTA_CRUZ[0].lng,
  });
  const [ventanaId, setVentanaId] = useState("ahora");
  const [descripcion, setDescripcion] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string>("");
  const [mostrarPuesto, setMostrarPuesto] = useState(false);
  const [mostrarOpcionales, setMostrarOpcionales] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performance.now();
  }, []);

  // Precargar mercado/puesto del comerciante para ahorrar escritura
  useEffect(() => {
    fetchWithTimeout("/api/auth/me", {}, 4000)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          const m = data.user.mercado || MERCADOS_SANTA_CRUZ[0].nombre;
          const p = data.user.puesto ? ` - ${data.user.puesto}` : "";
          setMercado(m);
          setDireccionTexto(`${m}${p}`);
          if (
            typeof data.user.lat === "number" &&
            typeof data.user.lng === "number"
          ) {
            setCoords({ lat: data.user.lat, lng: data.user.lng });
          }
        }
      })
      .catch(() => {
        // Offline: conserva valores por defecto
      });
  }, []);

  function handleSelectMercado(nombre: string) {
    setMercado(nombre);
    const m = MERCADOS_SANTA_CRUZ.find((x) => x.nombre === nombre);
    if (m) {
      setCoords({ lat: m.lat, lng: m.lng });
      setDireccionTexto(nombre);
    }
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    comprimirFoto(file)
      .then(setFotoUrl)
      .catch(() => notify("No pudimos leer esa foto. Probá con otra.", "error"));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoria || !cantidad) return;
    const ventana = calcularVentana(ventanaId);
    if (!ventana) {
      notify("Ese horario ya pasó. Elegí otra ventana de retiro.", "error");
      return;
    }
    setSubmitting(true);
    const { inicio, fin } = ventana;

    const payload = {
      categoria,
      cantidadAproximada: cantidad,
      descripcion: descripcion.trim() || undefined,
      fotoUrl: fotoUrl || undefined,
      mercado,
      direccionTexto: direccionTexto.trim() || mercado,
      lat: coords.lat,
      lng: coords.lng,
      ventanaInicio: inicio.toISOString(),
      ventanaFin: fin.toISOString(),
    };

    const guardarEnCola = (motivo: string) => {
      enqueuePublicacion(payload);
      notify(motivo, "info");
      router.push("/comerciante");
    };

    if (!navigator.onLine) {
      guardarEnCola(
        "Sin internet: guardado como 'Pendiente de envío'. Se subirá al volver la señal."
      );
      return;
    }

    try {
      const res = await fetchWithTimeout(
        "/api/publicaciones",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        6000
      );

      if (res.status >= 500) {
        guardarEnCola(
          "Servidor inestable: guardado como 'Pendiente de envío' para reintentar."
        );
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        notify(err.error || "No se pudo publicar.", "error");
        setSubmitting(false);
        return;
      }

      const duracionSeg =
        startTimeRef.current > 0
          ? Math.max(0.5, (performance.now() - startTimeRef.current) / 1000)
          : 0;

      if (duracionSeg > 0) {
        fetch("/api/metricas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "TIEMPO_PUBLICACION",
            valor: duracionSeg,
          }),
        }).catch(() => {});
      }

      notify(
        duracionSeg > 0
          ? `¡Excedente publicado en ${duracionSeg.toFixed(1)}s!`
          : "¡Excedente publicado! Ya lo ven los comedores cercanos.",
        "success"
      );
      router.push("/comerciante");
      router.refresh();
    } catch {
      guardarEnCola(
        "Señal débil o sin respuesta: guardado como 'Pendiente de envío'."
      );
    }
  }

  const ventanaReal = calcularVentana(ventanaId);
  const ventanaActual = ventanaReal
    ? `${horaDe(ventanaReal.inicio)} – ${horaDe(ventanaReal.fin)}`
    : "horario vencido";
  const listo = categoria !== null && cantidad !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-slate-950">
          Publicar en 4 toques
        </h2>
        <p className="text-xs font-bold text-slate-700">
          Elegí alimento, cantidad y hasta cuándo; luego tocá Publicar.
        </p>
      </div>

      <SelectorCategoria
        legend="1. ¿Qué te quedó?"
        value={categoria}
        onChange={setCategoria}
      />

      <SelectorCantidad
        legend="2. ¿Cuánto hay aprox.?"
        value={cantidad}
        onChange={setCantidad}
      />

      {/* 3. Ventana de retiro (siempre visible: es un dato clave) */}
      <fieldset>
        <legend className="text-sm font-black uppercase tracking-wide text-slate-950">
          3. ¿Hasta cuándo pueden retirar?
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {VENTANAS_RAPIDAS.map((v) => {
            const real = calcularVentana(v.id);
            const selected = ventanaId === v.id;
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={selected}
                disabled={!real}
                onClick={() => setVentanaId(v.id)}
                className={`flex min-h-[56px] flex-col items-center justify-center rounded-2xl border-2 p-2 text-center disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected
                    ? "border-emerald-950 bg-emerald-100 text-emerald-950"
                    : "border-slate-300 bg-white text-slate-900 hover:border-slate-600"
                }`}
              >
                <span className="text-sm font-black">{v.label}</span>
                <span className="text-[11px] font-bold text-slate-700">
                  {real ? `${horaDe(real.inicio)} – ${horaDe(real.fin)}` : "ya pasó"}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* 4. Resumen fijo (no dispara teclado al scrollear) */}
      <div className="rounded-2xl border-2 border-slate-900 bg-white p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 text-xs font-bold text-slate-800">
            <p className="flex items-center gap-1.5 text-slate-950">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{direccionTexto}</span>
            </p>
            <p className="flex items-center gap-1.5 text-emerald-900">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Retiro hoy: {ventanaActual}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMostrarPuesto((v) => !v)}
            className="flex min-h-[48px] shrink-0 items-center gap-1 rounded-xl border-2 border-slate-800 bg-slate-100 px-3 text-xs font-extrabold text-slate-950"
          >
            <span>Cambiar</span>
            {mostrarPuesto ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {mostrarPuesto && (
          <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
            <div>
              <label
                htmlFor="pub-mercado"
                className="block text-xs font-extrabold uppercase text-slate-700"
              >
                Mercado
              </label>
              <select
                id="pub-mercado"
                value={mercado}
                onChange={(e) => handleSelectMercado(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 bg-white px-3 text-sm font-bold"
              >
                {MERCADOS_SANTA_CRUZ.map((m) => (
                  <option key={m.nombre} value={m.nombre}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="pub-dir"
                className="block text-xs font-extrabold uppercase text-slate-700"
              >
                Puesto o pasillo
              </label>
              <input
                id="pub-dir"
                value={direccionTexto}
                onChange={(e) => setDireccionTexto(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 px-3 text-base"
              />
            </div>
          </div>
        )}
      </div>

      {/* Opcionales colapsables */}
      <div>
        <button
          type="button"
          onClick={() => setMostrarOpcionales((v) => !v)}
          className="flex min-h-[48px] w-full items-center justify-between rounded-xl border-2 border-dashed border-slate-400 bg-white px-4 text-sm font-bold text-slate-800"
        >
          <span>
            {fotoUrl || descripcion
              ? "Foto / nota agregada ✓"
              : "+ Agregar foto o nota (opcional)"}
          </span>
          {mostrarOpcionales ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        {mostrarOpcionales && (
          <div className="mt-2 space-y-3 rounded-2xl border-2 border-slate-300 bg-white p-3.5">
            <label className="flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-100 px-4 text-sm font-extrabold text-slate-950">
              <Camera className="h-5 w-5" aria-hidden="true" />
              <span>
                {fotoUrl ? "Foto cargada ✓ (cambiar)" : "Sacar o elegir foto"}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFotoChange}
                className="sr-only"
              />
            </label>
            <input
              aria-label="Nota corta opcional"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={140}
              placeholder="Nota corta (ej. 2 cajas de tomate maduro)"
              className="min-h-[48px] w-full rounded-xl border-2 border-slate-400 px-3 text-base"
            />
          </div>
        )}
      </div>

      {/* CTA al final del formulario: no flota sobre los campos ni sobre el teclado */}
      <button
        type="submit"
        disabled={submitting || !listo}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-950 bg-emerald-800 px-6 text-lg font-black text-white shadow-md hover:bg-emerald-900 disabled:opacity-60"
      >
        <Send className="h-5 w-5" aria-hidden="true" />
        <span>
          {submitting
            ? "Publicando..."
            : listo
              ? "PUBLICAR EXCEDENTE"
              : "Elegí alimento y cantidad"}
        </span>
      </button>
    </form>
  );
}

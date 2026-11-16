"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import type { CantidadAproximada, CategoriaAlimento } from "@/lib/types";
import { MERCADOS_SANTA_CRUZ } from "@/lib/constants";
import { formatHora } from "@/lib/formato";
import { calcularVentana } from "@/lib/ventanas";
import { comprimirFoto } from "@/lib/foto-cliente";
import { SelectorCategoria } from "@/components/publicar/SelectorCategoria";
import { SelectorCantidad } from "@/components/publicar/SelectorCantidad";
import { SelectorVentana } from "@/components/publicar/SelectorVentana";
import { UbicacionAviso } from "@/components/publicar/UbicacionAviso";
import { OpcionalesAviso } from "@/components/publicar/OpcionalesAviso";
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
        <Link
          href="/comerciante"
          className="inline-flex min-h-[48px] items-center gap-1.5 text-sm font-bold text-slate-700 underline underline-offset-4"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a mis avisos
        </Link>
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
      <SelectorVentana value={ventanaId} onChange={setVentanaId} />

      <UbicacionAviso
        mercado={mercado}
        direccionTexto={direccionTexto}
        ventanaActual={ventanaActual}
        onMercado={handleSelectMercado}
        onDireccion={setDireccionTexto}
      />

      <OpcionalesAviso
        fotoUrl={fotoUrl}
        descripcion={descripcion}
        onFoto={handleFotoChange}
        onDescripcion={setDescripcion}
      />

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

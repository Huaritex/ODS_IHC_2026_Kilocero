import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CANTIDAD_MAP, KG_POR_COMIDA } from "@/lib/constants";
import type { CantidadAproximada } from "@/lib/types";
import {
  Scale,
  CheckCircle2,
  Utensils,
  Clock,
  Flag,
  Timer,
  Star,
  Download,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    confirmadas,
    pendientesReceptores,
    reportadas,
    disponibles,
    tiemposPub,
    encuestasSus,
  ] = await Promise.all([
    prisma.publicacion.findMany({
      where: { estado: "CONFIRMADO" },
      select: { cantidadAproximada: true },
    }),
    prisma.usuario.count({
      where: { rol: "RECEPTOR", estadoVerificacion: "PENDIENTE" },
    }),
    prisma.publicacion.count({
      where: { reportada: true, ocultaPorAdmin: false },
    }),
    prisma.publicacion.count({
      where: { estado: "DISPONIBLE", ocultaPorAdmin: false },
    }),
    prisma.metricaUsabilidad.findMany({
      where: { tipo: "TIEMPO_PUBLICACION" },
      select: { valor: true },
    }),
    prisma.metricaUsabilidad.findMany({
      where: { tipo: "ENCUESTA_SUS" },
      select: { valor: true, puntajeSecundario: true },
    }),
  ]);

  const totalKg = confirmadas.reduce(
    (acc, p) =>
      acc + CANTIDAD_MAP[p.cantidadAproximada as CantidadAproximada].kgEstimados,
    0
  );
  const entregas = confirmadas.length;
  const comidasEquivalentes = Math.round(totalKg / KG_POR_COMIDA);

  const promedioSegundos =
    tiemposPub.length > 0
      ? tiemposPub.reduce((a, b) => a + b.valor, 0) / tiemposPub.length
      : null;

  // UMUX-Lite normalizado a escala 0..100
  const promedioSus =
    encuestasSus.length > 0
      ? Math.round(
          (encuestasSus.reduce(
            (a, b) => a + (b.valor + (b.puntajeSecundario ?? b.valor)) / 2,
            0
          ) /
            encuestasSus.length /
            5) *
            100
        )
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-950">
            Métricas de impacto
          </h2>
          <p className="text-sm font-semibold text-slate-700">
            Cálculo estimado a partir de entregas confirmadas (Poco = 2 kg,
            Medio = 5 kg, Mucho = 12 kg).
          </p>
        </div>

        <a
          href="/api/admin/exportar"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-4 text-sm font-extrabold text-slate-950 hover:bg-slate-100"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>Exportar reporte (.csv)</span>
        </a>
      </div>

      <section
        aria-label="Indicadores principales de impacto"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-2xl border-2 border-slate-900 bg-white p-5">
          <div className="flex items-center justify-between text-emerald-900">
            <span className="text-xs font-extrabold uppercase">
              Kg rescatados
            </span>
            <Scale className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {totalKg} kg
          </p>
        </div>

        <div className="rounded-2xl border-2 border-slate-900 bg-white p-5">
          <div className="flex items-center justify-between text-sky-900">
            <span className="text-xs font-extrabold uppercase">
              Entregas confirmadas
            </span>
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950">{entregas}</p>
        </div>

        <div className="rounded-2xl border-2 border-slate-900 bg-white p-5">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-xs font-extrabold uppercase">
              Comidas equivalentes
            </span>
            <Utensils className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {comidasEquivalentes}
          </p>
        </div>

        <div className="rounded-2xl border-2 border-slate-900 bg-white p-5">
          <div className="flex items-center justify-between text-slate-800">
            <span className="text-xs font-extrabold uppercase">
              Ofertas activas hoy
            </span>
            <Clock className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {disponibles}
          </p>
        </div>
      </section>

      {/* Evidencia empírica HCI */}
      <section
        aria-label="Métricas empíricas de usabilidad HCI"
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="rounded-2xl border-2 border-slate-900 bg-white p-5">
          <div className="flex items-center justify-between text-emerald-900">
            <span className="text-xs font-extrabold uppercase">
              Tiempo promedio de publicación
            </span>
            <Timer className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {promedioSegundos !== null
              ? `${promedioSegundos.toFixed(1)} s`
              : "Sin datos"}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-700">
            Meta HCI: &lt; 20 s · Basado en {tiemposPub.length} registro(s)
            {promedioSegundos !== null && promedioSegundos < 20
              ? " · ✓ Cumplida"
              : ""}
          </p>
        </div>

        <div className="rounded-2xl border-2 border-slate-900 bg-white p-5">
          <div className="flex items-center justify-between text-sky-900">
            <span className="text-xs font-extrabold uppercase">
              Usabilidad percibida (UMUX-Lite)
            </span>
            <Star className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {promedioSus !== null ? `${promedioSus} / 100` : "Sin datos"}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-700">
            Basado en {encuestasSus.length} encuesta(s) post-entrega
          </p>
        </div>
      </section>

      <section
        aria-label="Tareas pendientes de administración"
        className="grid gap-4 sm:grid-cols-2"
      >
        <div className="rounded-2xl border-2 border-slate-900 bg-white p-5">
          <h3 className="text-lg font-black text-slate-950">
            Receptores por verificar: {pendientesReceptores}
          </h3>
          <p className="mt-1 text-sm text-slate-700">
            Comedores y ONGs esperando aprobación para poder reservar excedentes.
          </p>
          <Link
            href="/admin/receptores"
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            Revisar solicitudes
          </Link>
        </div>

        <div className="rounded-2xl border-2 border-slate-900 bg-white p-5">
          <h3 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <Flag className="h-5 w-5 text-rose-700" aria-hidden="true" />
            <span>Publicaciones reportadas: {reportadas}</span>
          </h3>
          <p className="mt-1 text-sm text-slate-700">
            Revisá reportes de calidad o seguridad alimentaria y moderá si
            corresponde.
          </p>
          <Link
            href="/admin/publicaciones"
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            Ir a moderación
          </Link>
        </div>
      </section>
    </div>
  );
}

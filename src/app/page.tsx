import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROL_HOME } from "@/lib/constants";
import { Store, HeartHandshake, ShieldCheck, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect(ROL_HOME[session.rol]);
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-36px)] max-w-4xl flex-col justify-center px-4 py-10">
      <div className="rounded-3xl border-2 border-slate-900 bg-white p-6 shadow-sm sm:p-10">
        <span className="inline-block rounded-full border-2 border-emerald-800 bg-emerald-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-950">
          Santa Cruz de la Sierra · MVP HCI
        </span>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          Kilo Cero
        </h1>
        <p className="mt-3 max-w-2xl text-lg font-medium text-slate-800 leading-relaxed">
          Conectamos el excedente diario de los mercados{" "}
          <strong>Abasto, Mutualista y Los Pozos</strong> con comedores
          populares, hogares y ONGs antes del cierre (17:00–19:00).
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
            <Store className="h-7 w-7 text-emerald-800" aria-hidden="true" />
            <h2 className="mt-2 text-lg font-extrabold text-slate-950">
              Comerciante
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              Publicá tu excedente en menos de 20 segundos, sin pesar ni
              complicarte.
            </p>
          </div>
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
            <HeartHandshake
              className="h-7 w-7 text-sky-800"
              aria-hidden="true"
            />
            <h2 className="mt-2 text-lg font-extrabold text-slate-950">
              Receptor
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              Explorá excedentes cercanos en lista o mapa y reservá tu retiro.
            </p>
          </div>
          <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
            <ShieldCheck
              className="h-7 w-7 text-slate-900"
              aria-hidden="true"
            />
            <h2 className="mt-2 text-lg font-extrabold text-slate-950">
              Administrador
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              Verificá comedores, moderá reportes y medí kilos rescatados.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 py-3 text-base font-extrabold text-white hover:bg-emerald-900"
          >
            <span>Ingresar (o probar demo)</span>
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            href="/registro"
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl border-2 border-slate-900 bg-white px-6 py-3 text-base font-extrabold text-slate-950 hover:bg-slate-100"
          >
            Crear cuenta nueva
          </Link>
        </div>
      </div>
    </main>
  );
}

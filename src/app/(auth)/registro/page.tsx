"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { api } from "@/lib/api-client";
import { MERCADOS_SANTA_CRUZ } from "@/lib/constants";
import { CampoTexto } from "@/components/auth/CampoTexto";
import { SelectorRol, type RolRegistro } from "@/components/auth/SelectorRol";
import { useToast } from "@/components/ToastProvider";

export default function RegistroPage() {
  const router = useRouter();
  const { notify } = useToast();

  const [rol, setRol] = useState<RolRegistro>("COMERCIANTE");
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    mercado: MERCADOS_SANTA_CRUZ[0].nombre as string,
    puesto: "",
    organizacion: "",
    direccion: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const campo = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const r = await api<{ redirectTo: string }>("/api/auth/register", {
      method: "POST",
      json: { rol, ...form },
    });
    if (!r.ok || !r.data) {
      setError(r.error || "No pudimos crear tu cuenta.");
      setLoading(false);
      return;
    }

    notify(
      rol === "RECEPTOR"
        ? "Cuenta creada. Queda pendiente de verificación por el Admin."
        : "¡Cuenta lista! Ya podés publicar excedentes.",
      "success"
    );
    router.push(r.data.redirectTo);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-36px)] max-w-md flex-col justify-center px-4 py-8">
      <div className="rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-sm">
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center text-sm font-bold text-slate-700 underline underline-offset-4"
        >
          ← Volver al inicio
        </Link>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Crear cuenta</h1>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border-2 border-rose-700 bg-rose-50 p-3 text-sm font-bold text-rose-950"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <SelectorRol value={rol} onChange={setRol} />

          <CampoTexto id="nombre" label="Nombre completo" required placeholder="Ej. Juana Pérez" {...campo("nombre")} />

          {rol === "COMERCIANTE" ? (
            <>
              <div>
                <label htmlFor="mercado" className="block text-sm font-extrabold text-slate-950">
                  Mercado habitual
                </label>
                <select
                  id="mercado"
                  {...campo("mercado")}
                  className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 bg-white px-4 text-base font-semibold"
                >
                  {MERCADOS_SANTA_CRUZ.map((m) => (
                    <option key={m.nombre} value={m.nombre}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <CampoTexto id="puesto" label="Número de puesto / sector" placeholder="Ej. Pasillo 2, Puesto 14" {...campo("puesto")} />
            </>
          ) : (
            <>
              <CampoTexto id="organizacion" label="Nombre del comedor, hogar u ONG" required placeholder="Ej. Comedor Barrio Lindo" {...campo("organizacion")} />
              <CampoTexto id="direccion" label="Dirección / Zona" placeholder="Ej. Plan 3000, Av. Paurito" {...campo("direccion")} />
            </>
          )}

          <CampoTexto id="telefono" type="tel" label="WhatsApp / Teléfono (opcional)" placeholder="+591 7..." {...campo("telefono")} />
          <CampoTexto id="reg-email" type="email" required label="Correo electrónico" placeholder="correo@ejemplo.bo" {...campo("email")} />
          <CampoTexto id="reg-password" type="password" required minLength={6} label="Contraseña (mín. 6 caracteres)" {...campo("password")} />

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 text-base font-extrabold text-white hover:bg-emerald-900 disabled:opacity-60"
          >
            <UserPlus className="h-5 w-5" aria-hidden="true" />
            <span>{loading ? "Creando cuenta..." : "Crear cuenta"}</span>
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-800">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="inline-flex min-h-[48px] items-center font-extrabold text-emerald-900 underline underline-offset-4"
          >
            Ingresar
          </Link>
        </p>
      </div>
    </main>
  );
}

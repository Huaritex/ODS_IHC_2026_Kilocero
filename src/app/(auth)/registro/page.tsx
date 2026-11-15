"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, HeartHandshake, UserPlus } from "lucide-react";
import { MERCADOS_SANTA_CRUZ } from "@/lib/constants";
import { useToast } from "@/components/ToastProvider";

export default function RegistroPage() {
  const router = useRouter();
  const { notify } = useToast();

  const [rol, setRol] = useState<"COMERCIANTE" | "RECEPTOR">("COMERCIANTE");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mercado, setMercado] = useState(MERCADOS_SANTA_CRUZ[0].nombre);
  const [puesto, setPuesto] = useState("");
  const [organizacion, setOrganizacion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rol,
          nombre,
          email,
          password,
          telefono,
          mercado,
          puesto,
          organizacion,
          direccion,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No pudimos crear tu cuenta.");
        setLoading(false);
        return;
      }

      notify(
        rol === "RECEPTOR"
          ? "Cuenta creada. Queda pendiente de verificación por el Admin."
          : "¡Cuenta lista! Ya podés publicar excedentes.",
        "success"
      );
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Error de red. Verificá tu conexión.");
      setLoading(false);
    }
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
        <h1 className="mt-3 text-3xl font-black text-slate-950">
          Crear cuenta
        </h1>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border-2 border-rose-700 bg-rose-50 p-3 text-sm font-bold text-rose-950"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <fieldset>
            <legend className="text-sm font-extrabold text-slate-950">
              ¿Cuál es tu rol?
            </legend>
            <div
              role="radiogroup"
              aria-label="Selección de rol"
              className="mt-2 grid grid-cols-2 gap-3"
            >
              <button
                type="button"
                role="radio"
                aria-checked={rol === "COMERCIANTE"}
                onClick={() => setRol("COMERCIANTE")}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 text-sm font-extrabold ${
                  rol === "COMERCIANTE"
                    ? "border-emerald-900 bg-emerald-100 text-emerald-950"
                    : "border-slate-300 bg-white text-slate-800"
                }`}
              >
                <Store className="h-5 w-5" aria-hidden="true" />
                <span>Comerciante</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={rol === "RECEPTOR"}
                onClick={() => setRol("RECEPTOR")}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 text-sm font-extrabold ${
                  rol === "RECEPTOR"
                    ? "border-sky-900 bg-sky-100 text-sky-950"
                    : "border-slate-300 bg-white text-slate-800"
                }`}
              >
                <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                <span>Comedor / ONG</span>
              </button>
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-extrabold text-slate-950"
            >
              Nombre completo
            </label>
            <input
              id="nombre"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Juana Pérez"
              className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 px-4 text-base"
            />
          </div>

          {rol === "COMERCIANTE" ? (
            <>
              <div>
                <label
                  htmlFor="mercado"
                  className="block text-sm font-extrabold text-slate-950"
                >
                  Mercado habitual
                </label>
                <select
                  id="mercado"
                  value={mercado}
                  onChange={(e) => setMercado(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 bg-white px-4 text-base font-semibold"
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
                  htmlFor="puesto"
                  className="block text-sm font-extrabold text-slate-950"
                >
                  Número de puesto / sector
                </label>
                <input
                  id="puesto"
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value)}
                  placeholder="Ej. Pasillo 2, Puesto 14"
                  className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 px-4 text-base"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label
                  htmlFor="organizacion"
                  className="block text-sm font-extrabold text-slate-950"
                >
                  Nombre del comedor, hogar u ONG
                </label>
                <input
                  id="organizacion"
                  required
                  value={organizacion}
                  onChange={(e) => setOrganizacion(e.target.value)}
                  placeholder="Ej. Comedor Barrio Lindo"
                  className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 px-4 text-base"
                />
              </div>
              <div>
                <label
                  htmlFor="direccion"
                  className="block text-sm font-extrabold text-slate-950"
                >
                  Dirección / Zona
                </label>
                <input
                  id="direccion"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej. Plan 3000, Av. Paurito"
                  className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 px-4 text-base"
                />
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="telefono"
              className="block text-sm font-extrabold text-slate-950"
            >
              WhatsApp / Teléfono (opcional)
            </label>
            <input
              id="telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+591 7..."
              className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 px-4 text-base"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-sm font-extrabold text-slate-950"
            >
              Correo electrónico
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.bo"
              className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 px-4 text-base"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-sm font-extrabold text-slate-950"
            >
              Contraseña (mín. 6 caracteres)
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 px-4 text-base"
            />
          </div>

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

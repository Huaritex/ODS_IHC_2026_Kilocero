"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Store, HeartHandshake, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

const DEMO_ACCOUNTS = [
  {
    label: "Comerciante · Doña Carmen (Abasto)",
    email: "carmen@abasto.bo",
    icon: Store,
    badge: "Mobile-first",
  },
  {
    label: "Receptor · Comedor Virgen de Cotoca",
    email: "comedor@cotoca.bo",
    icon: HeartHandshake,
    badge: "Verificado",
  },
  {
    label: "Admin · Coordinador UCB",
    email: "admin@kilocero.bo",
    icon: ShieldCheck,
    badge: "Escritorio",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { notify } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitLogin(targetEmail: string, targetPassword: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No pudimos iniciar sesión.");
        setLoading(false);
        return;
      }
      notify(`Bienvenido/a, ${data.user.nombre}`, "success");
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Error de red. Verificá tu conexión.");
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitLogin(email, password);
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
          Ingresar a Kilo Cero
        </h1>
        <p className="mt-1 text-sm text-slate-700">
          Cada rol accede únicamente a su espacio de trabajo.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border-2 border-rose-700 bg-rose-50 p-3 text-sm font-bold text-rose-950"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-extrabold text-slate-950"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carmen@abasto.bo"
              className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 bg-white px-4 text-base text-slate-950"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-extrabold text-slate-950"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 min-h-[48px] w-full rounded-xl border-2 border-slate-900 bg-white px-4 text-base text-slate-950"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 text-base font-extrabold text-white hover:bg-emerald-900 disabled:opacity-60"
          >
            <LogIn className="h-5 w-5" aria-hidden="true" />
            <span>{loading ? "Ingresando..." : "Ingresar"}</span>
          </button>
        </form>

        <div className="mt-7 border-t-2 border-slate-200 pt-5">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Acceso rápido para demo (clave: kilocero2026)
          </p>
          <div className="mt-3 space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading}
                  onClick={() => submitLogin(acc.email, "kilocero2026")}
                  className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border-2 border-slate-800 bg-slate-50 px-3.5 py-2.5 text-left text-sm font-bold text-slate-950 hover:bg-slate-200 disabled:opacity-60"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{acc.label}</span>
                  </span>
                  <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
                    {acc.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-800">
          ¿No tenés cuenta?{" "}
          <Link
            href="/registro"
            className="inline-flex min-h-[48px] items-center font-extrabold text-emerald-900 underline underline-offset-4"
          >
            Registrate aquí
          </Link>
        </p>
      </div>
    </main>
  );
}

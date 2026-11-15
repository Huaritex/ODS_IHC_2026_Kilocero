import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { ConnectionBanner } from "@/components/ConnectionBanner";

export const metadata: Metadata = {
  title: "Kilo Cero · Rescate de alimentos en Santa Cruz",
  description:
    "Plataforma web para conectar excedentes de mercados de Santa Cruz de la Sierra con comedores populares y ONGs.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-950 antialiased">
        <ToastProvider>
          <ConnectionBanner />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

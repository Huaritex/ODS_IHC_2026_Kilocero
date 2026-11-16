import { MessageCircle, Navigation, Phone } from "lucide-react";
import { formatWhatsappUrl, mapsDireccionesUrl } from "@/lib/formato";

const BASE =
  "inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-xs font-extrabold";

/** "Cómo llegar", WhatsApp y Llamar: se usan en el detalle y en Mis reservas. */
export function AccesosContacto({
  lat,
  lng,
  telefono,
}: {
  lat: number;
  lng: number;
  telefono: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={mapsDireccionesUrl(lat, lng)}
        target="_blank"
        rel="noopener noreferrer"
        className={`${BASE} border-slate-900 bg-slate-100 text-slate-950 hover:bg-slate-200`}
      >
        <Navigation className="h-4 w-4" aria-hidden="true" />
        <span>Cómo llegar</span>
      </a>
      {telefono && (
        <>
          <a
            href={formatWhatsappUrl(telefono)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${BASE} border-emerald-900 bg-emerald-100 text-emerald-950 hover:bg-emerald-200`}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
          <a
            href={`tel:${telefono}`}
            className={`${BASE} border-slate-900 bg-white text-slate-950 hover:bg-slate-100`}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>Llamar</span>
          </a>
        </>
      )}
    </div>
  );
}

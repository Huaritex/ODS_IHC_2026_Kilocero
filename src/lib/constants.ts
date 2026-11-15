import type {
  CantidadAproximada,
  CategoriaAlimento,
  EstadoPublicacion,
  EstadoVerificacion,
  Rol,
} from "./types";

export interface CategoriaMeta {
  value: CategoriaAlimento;
  label: string;
  ejemplos: string;
  emoji: string;
}

export const CATEGORIAS_ALIMENTO: CategoriaMeta[] = [
  {
    value: "VERDURAS",
    label: "Verduras",
    ejemplos: "Tomate, papa, cebolla, lechuga",
    emoji: "🥬",
  },
  {
    value: "FRUTAS",
    label: "Frutas",
    ejemplos: "Plátano, naranja, papaya, piña",
    emoji: "🍌",
  },
  {
    value: "PANIFICACION",
    label: "Pan y masas",
    ejemplos: "Pan casero, cuñapé, empanadas",
    emoji: "🥖",
  },
  {
    value: "CARNES",
    label: "Carnes",
    ejemplos: "Pollo, res, cerdo refrigerado",
    emoji: "🥩",
  },
  {
    value: "LACTEOS",
    label: "Lácteos",
    ejemplos: "Queso criollo, leche, yogurt",
    emoji: "🧀",
  },
  {
    value: "COMIDA_PREPARADA",
    label: "Comida lista",
    ejemplos: "Porciones del día, sopas, arroz",
    emoji: "🍲",
  },
  {
    value: "OTROS",
    label: "Otros",
    ejemplos: "Granos, tubérculos, abarrotes",
    emoji: "🧺",
  },
];

export const CATEGORIA_MAP: Record<CategoriaAlimento, CategoriaMeta> =
  Object.fromEntries(CATEGORIAS_ALIMENTO.map((c) => [c.value, c])) as Record<
    CategoriaAlimento,
    CategoriaMeta
  >;

export interface CantidadMeta {
  value: CantidadAproximada;
  label: string;
  referencia: string;
  kgEstimados: number;
}

export const CANTIDADES_APROXIMADAS: CantidadMeta[] = [
  {
    value: "POCO",
    label: "Poco",
    referencia: "1 bolsa / ~2 kg",
    kgEstimados: 2,
  },
  {
    value: "MEDIO",
    label: "Medio",
    referencia: "1 caja o balde / ~5 kg",
    kgEstimados: 5,
  },
  {
    value: "MUCHO",
    label: "Mucho",
    referencia: "2+ cajas / ~12 kg",
    kgEstimados: 12,
  },
];

export const CANTIDAD_MAP: Record<CantidadAproximada, CantidadMeta> =
  Object.fromEntries(CANTIDADES_APROXIMADAS.map((c) => [c.value, c])) as Record<
    CantidadAproximada,
    CantidadMeta
  >;

/** 1 comida equivalente ≈ 0.4 kg (400 g) */
export const KG_POR_COMIDA = 0.4;

export interface MercadoSCZ {
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
}

export const MERCADOS_SANTA_CRUZ: MercadoSCZ[] = [
  {
    nombre: "Mercado Abasto",
    direccion: "Av. Piraí y 3er Anillo Interno, Santa Cruz",
    lat: -17.7958,
    lng: -63.1965,
  },
  {
    nombre: "Mercado Mutualista",
    direccion: "Av. Mutualista y 3er Anillo, Santa Cruz",
    lat: -17.7689,
    lng: -63.1642,
  },
  {
    nombre: "Mercado Los Pozos",
    direccion: "Calle Suárez Arana y Campero, Santa Cruz",
    lat: -17.7782,
    lng: -63.1783,
  },
];

export const CENTRO_SANTA_CRUZ = {
  lat: -17.7833,
  lng: -63.1821,
};

export const ESTADO_PUBLICACION_UI: Record<
  EstadoPublicacion,
  { label: string; symbol: string; classes: string }
> = {
  DISPONIBLE: {
    label: "Disponible",
    symbol: "●",
    classes: "bg-emerald-100 text-emerald-950 border-emerald-700",
  },
  RESERVADO: {
    label: "Reservado",
    symbol: "◷",
    classes: "bg-amber-100 text-amber-950 border-amber-700",
  },
  RETIRADO: {
    label: "Retirado (falta confirmar)",
    symbol: "⇄",
    classes: "bg-sky-100 text-sky-950 border-sky-700",
  },
  CONFIRMADO: {
    label: "Confirmado",
    symbol: "✓",
    classes: "bg-slate-200 text-slate-950 border-slate-700",
  },
  EXPIRADO: {
    label: "Expirado",
    symbol: "✕",
    classes: "bg-rose-100 text-rose-950 border-rose-700",
  },
};

export const ESTADO_VERIFICACION_UI: Record<
  EstadoVerificacion,
  { label: string; symbol: string; classes: string }
> = {
  PENDIENTE: {
    label: "Pendiente de verificación",
    symbol: "◷",
    classes: "bg-amber-100 text-amber-950 border-amber-700",
  },
  VERIFICADO: {
    label: "Verificado",
    symbol: "✓",
    classes: "bg-emerald-100 text-emerald-950 border-emerald-700",
  },
  RECHAZADO: {
    label: "Rechazado",
    symbol: "✕",
    classes: "bg-rose-100 text-rose-950 border-rose-700",
  },
};

export const ROL_HOME: Record<Rol, string> = {
  COMERCIANTE: "/comerciante",
  RECEPTOR: "/receptor",
  ADMIN: "/admin",
};

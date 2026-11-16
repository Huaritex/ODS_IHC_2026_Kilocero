import type {
  CantidadAproximada,
  CategoriaAlimento,
  EstadoPublicacion,
  EstadoVerificacion,
} from "@/lib/types";

export interface ReceptorRow {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  organizacion: string | null;
  direccion: string | null;
  estadoVerificacion: EstadoVerificacion;
  motivoRechazo: string | null;
}

export interface AdminPubRow {
  id: string;
  categoria: CategoriaAlimento;
  cantidadAproximada: CantidadAproximada;
  mercado: string;
  direccionTexto: string;
  estado: EstadoPublicacion;
  reportada: boolean;
  motivoReporte: string | null;
  ocultaPorAdmin: boolean;
  comerciante: { nombre: string };
}

export interface LocalRow {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  mercado: string | null;
  puesto: string | null;
  suspendido: boolean;
  motivoSuspension: string | null;
  createdAt: string;
  totalPublicaciones: number;
  activas: number;
  entregasConfirmadas: number;
  kgRescatados: number;
  reportadas: number;
  ultimaPublicacion: string | null;
}

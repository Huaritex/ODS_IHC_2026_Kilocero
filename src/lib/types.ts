export type Rol = "COMERCIANTE" | "RECEPTOR" | "ADMIN";

export type EstadoVerificacion = "PENDIENTE" | "VERIFICADO" | "RECHAZADO";

export type CategoriaAlimento =
  | "VERDURAS"
  | "FRUTAS"
  | "PANIFICACION"
  | "CARNES"
  | "LACTEOS"
  | "COMIDA_PREPARADA"
  | "OTROS";

export type CantidadAproximada = "POCO" | "MEDIO" | "MUCHO";

export type EstadoPublicacion =
  | "DISPONIBLE"
  | "RESERVADO"
  | "RETIRADO"
  | "CONFIRMADO"
  | "EXPIRADO";

export type EstadoReserva =
  | "ACTIVA"
  | "COMPLETADA"
  | "CANCELADA"
  | "EXPIRADA";

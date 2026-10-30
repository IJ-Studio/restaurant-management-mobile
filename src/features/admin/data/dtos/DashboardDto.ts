/** GET /dashboard/admin/stats */
export interface AdminStatsDto {
  totalVentas: number | string | null;
  pedidosPendientes: number | null;
  pedidosEnPreparacion: number | null;
  mesasOcupadas: number | null;
  mesasLibres: number | null;
  totalMesas: number | null;
}

/** Fila de GET /reservations/map: mesa activa y si tiene reservación en las próximas 2 horas. */
export interface TableMapDto {
  id: number;
  numero: string;
  capacidad: number;
  areaNombre: string | null;
  /** "ocupada" (reservada en las próximas 2 h) o "disponible". */
  estado: string;
  [extra: string]: unknown;
}

/** GET /dashboard/admin/stats */
export interface AdminStatsDto {
  totalVentas: number | string;
  pedidosPendientes: number;
  pedidosEnPreparacion: number;
  mesasOcupadas: number;
  mesasLibres: number;
  totalMesas: number;
}

/** GET /dashboard/admin/ventas-por-hora */
export interface SalesByHourDto {
  ventas: (number | string)[];
  totalDia: number | string;
}

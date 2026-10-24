export interface DashboardStats {
  /** Ventas del día en pesos (sin canceladas). */
  totalSales: number;
  pendingOrders: number;
  ordersInPreparation: number;
  occupiedTables: number;
  freeTables: number;
  totalTables: number;
}

export interface Dashboard {
  stats: DashboardStats;
  /** 24 posiciones: ventas por hora del día (0 a 23). */
  salesByHour: number[];
}

/** Hora con más ventas, o `null` si no hubo ventas. */
export function peakHour(salesByHour: number[]): number | null {
  let peak: number | null = null;
  salesByHour.forEach((total, hour) => {
    if (total > 0 && (peak === null || total > salesByHour[peak])) peak = hour;
  });
  return peak;
}

/** Porcentaje de ocupación (0 a 100). */
export function occupancy(stats: DashboardStats): number {
  return stats.totalTables > 0 ? Math.round((stats.occupiedTables / stats.totalTables) * 100) : 0;
}

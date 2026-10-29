import type { ActiveOrder } from '../../../orders/domain/entities/ActiveOrder';

/** Totales del día que calcula el API (GET /dashboard/admin/stats). */
export interface DailyStats {
  salesTotal: number;
  /** Pedidos en carrito que aún no se mandan a cocina. */
  pendingOrders: number;
  /** Pedidos en cocina (enviados o en preparación). */
  ordersInKitchen: number;
  /** Listos para llevar a la mesa. */
  readyOrders: number;
  /** Entregados que falta cobrar. */
  ordersToCharge: number;
}

/** Mesa del mapa de reservaciones (GET /reservations/map). */
export interface TableMapEntry {
  id: number;
  area?: string;
  /** Tiene una reservación en las próximas 2 horas. */
  reserved: boolean;
}

/** `ocupada`: tiene un pedido activo hoy · `reservada`: reservación en las próximas 2 h · `libre`. */
export type TableState = 'ocupada' | 'reservada' | 'libre';

export interface TableStatus {
  id: number;
  number: string;
  name?: string;
  area?: string;
  capacity: number;
  state: TableState;
  activeOrders: number;
}

export interface DashboardSummary {
  stats: DailyStats;
  tables: TableStatus[];
  occupiedTables: number;
  recentOrders: ActiveOrder[];
}

import type { Incident } from '../../../kitchen/domain/Kitchen';
import type { ActiveOrder } from '../../../orders/domain/entities/ActiveOrder';
import type { TableShape } from '../../../orders/domain/entities/TableOrder';

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
  shape?: TableShape;
  state: TableState;
  activeOrders: number;
  /** Ya se le entregó y falta cobrar. */
  awaitingPayment?: boolean;
}

/** Resumen del día (GET /reportes/hoy): quién vendió, cómo pagaron, qué se vendió. */
export interface DailyReport {
  sales: {
    collected: number;
    tips: number;
    payments: number;
    paidOrders: number;
    averageTicket: number;
    guests: number;
  };
  ordersToday: number;
  byMethod: { method: string; total: number; payments: number }[];
  byCashier: { name: string; total: number; payments: number }[];
  byWaiter: { name: string; orders: number; total: number; guests: number }[];
  /** Cobrado por hora del día (0-23). */
  byHour: number[];
  topDishes: { name: string; quantity: number; total: number }[];
  latestPayments: {
    orderId: string;
    table?: string;
    amount: number;
    tip: number;
    method?: string;
    cashier?: string;
    at?: string;
  }[];
  incidents: Incident[];
  waste: { records: number; cost: number };
  openRegisters: { id: number; cashier?: string; since?: string }[];
}

export interface DashboardSummary {
  stats: DailyStats;
  tables: TableStatus[];
  occupiedTables: number;
  recentOrders: ActiveOrder[];
  /** Puede faltar si el API no lo tiene o falló: el resto del Dashboard se muestra igual. */
  report?: DailyReport;
}

import type { OrderRepository } from '../../../orders/domain/repositories/OrderRepository';
import type { DashboardSummary, TableState, TableStatus } from '../entities/DashboardSummary';
import type { DashboardRepository } from '../repositories/DashboardRepository';

const collator = new Intl.Collator('es', { numeric: true });

/**
 * Resumen del día para el administrador: totales, pedidos activos y el estado de cada mesa.
 * Las mesas no guardan su estado en la base: una mesa está ocupada si tiene un pedido activo hoy
 * y reservada si tiene una reservación en las próximas 2 horas.
 */
export class GetDashboardUseCase {
  constructor(
    private readonly dashboard: DashboardRepository,
    private readonly orders: OrderRepository,
  ) {}

  async execute(): Promise<DashboardSummary> {
    const [stats, tables, tableMap, recentOrders] = await Promise.all([
      this.dashboard.getDailyStats(),
      this.orders.listTables(),
      this.dashboard.getTableMap(),
      this.orders.listActive(),
    ]);

    const ordersByTable = new Map<string, number>();
    for (const order of recentOrders) {
      if (order.tableNumber)
        ordersByTable.set(order.tableNumber, (ordersByTable.get(order.tableNumber) ?? 0) + 1);
    }
    const mapById = new Map(tableMap.map((entry) => [entry.id, entry]));

    const statuses: TableStatus[] = [...tables]
      .sort((a, b) => collator.compare(a.number, b.number))
      .map((table) => {
        const activeOrders = ordersByTable.get(table.number) ?? 0;
        const entry = mapById.get(table.id);
        let state: TableState = 'libre';
        if (activeOrders > 0) state = 'ocupada';
        else if (entry?.reserved) state = 'reservada';
        return { ...table, area: entry?.area, state, activeOrders };
      });

    return {
      stats,
      tables: statuses,
      occupiedTables: statuses.filter((table) => table.state === 'ocupada').length,
      recentOrders,
    };
  }
}

import type { DashboardSummary } from '../domain/entities/DashboardSummary';
import type { DashboardRepository } from '../domain/repositories/DashboardRepository';
import { makeActiveOrder } from '../../orders/__fixtures__/orders';

export function makeDashboardRepository(): jest.Mocked<DashboardRepository> {
  return {
    getDailyStats: jest.fn().mockResolvedValue({ salesTotal: 1250.5, pendingOrders: 1, ordersInKitchen: 2 }),
    getTableMap: jest.fn().mockResolvedValue([
      { id: 2, area: 'Terraza', reserved: true },
      { id: 5, area: 'Salón', reserved: true },
      { id: 10, area: 'Salón', reserved: false },
    ]),
  };
}

export function makeDashboardSummary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    stats: { salesTotal: 1250.5, pendingOrders: 1, ordersInKitchen: 2 },
    tables: [
      {
        id: 2,
        number: '2',
        name: 'Terraza',
        area: 'Terraza',
        capacity: 4,
        state: 'reservada',
        activeOrders: 0,
      },
      { id: 5, number: '5', area: 'Salón', capacity: 2, state: 'ocupada', activeOrders: 1 },
      { id: 10, number: '10', area: 'Salón', capacity: 6, state: 'libre', activeOrders: 0 },
    ],
    occupiedTables: 1,
    recentOrders: [makeActiveOrder()],
    ...overrides,
  };
}

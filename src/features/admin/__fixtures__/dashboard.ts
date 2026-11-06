import type { DailyReport, DashboardSummary } from '../domain/entities/DashboardSummary';
import type { DashboardRepository } from '../domain/repositories/DashboardRepository';
import { makeActiveOrder } from '../../orders/__fixtures__/orders';

export function makeDashboardRepository(): jest.Mocked<DashboardRepository> {
  return {
    getDailyStats: jest.fn().mockResolvedValue({
      salesTotal: 1250.5,
      pendingOrders: 1,
      ordersInKitchen: 2,
      readyOrders: 1,
      ordersToCharge: 3,
    }),
    getTableMap: jest.fn().mockResolvedValue([
      { id: 2, area: 'Terraza', reserved: true },
      { id: 5, area: 'Salón', reserved: true },
      { id: 10, area: 'Salón', reserved: false },
    ]),
    getDailyReport: jest.fn().mockResolvedValue(makeDailyReport()),
  };
}

export function makeDailyReport(overrides: Partial<DailyReport> = {}): DailyReport {
  const byHour = Array.from({ length: 24 }, () => 0);
  byHour[13] = 450;
  byHour[14] = 800.5;
  return {
    sales: { collected: 1250.5, tips: 120, payments: 6, paidOrders: 5, averageTicket: 250.1, guests: 14 },
    ordersToday: 7,
    byMethod: [
      { method: 'Efectivo', total: 800.5, payments: 4 },
      { method: 'Tarjeta débito', total: 450, payments: 2 },
    ],
    byCashier: [{ name: 'Carlos Soto', total: 1250.5, payments: 6 }],
    byWaiter: [
      { name: 'Mariana Pérez', orders: 4, total: 900, guests: 9 },
      { name: 'Luis Gil', orders: 3, total: 350.5, guests: 5 },
    ],
    byHour,
    topDishes: [
      { name: 'Enchiladas suizas', quantity: 8, total: 1164 },
      { name: 'Café de olla', quantity: 5, total: 225 },
    ],
    latestPayments: [
      {
        orderId: 'a',
        table: 'S01',
        amount: 300,
        tip: 30,
        method: 'Efectivo',
        cashier: 'Carlos Soto',
        at: '2026-10-28T20:15:00.000Z',
      },
    ],
    incidents: [{ id: '1', type: 'retraso', minutes: 15, reportedBy: 'Diego Luna', table: 'S01' }],
    waste: { records: 2, cost: 200.5 },
    openRegisters: [{ id: 7, cashier: 'Carlos Soto', since: '2026-10-28T14:00:00.000Z' }],
    ...overrides,
  };
}

export function makeDashboardSummary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    stats: { salesTotal: 1250.5, pendingOrders: 1, ordersInKitchen: 2, readyOrders: 1, ordersToCharge: 3 },
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
    report: makeDailyReport(),
    ...overrides,
  };
}

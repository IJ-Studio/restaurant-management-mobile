import { occupancy, peakHour, type DashboardStats } from '../entities/Dashboard';
import type { DashboardRepository } from '../repositories/DashboardRepository';
import { GetDashboardUseCase } from '../usecases/GetDashboardUseCase';

const stats: DashboardStats = {
  totalSales: 1500,
  pendingOrders: 2,
  ordersInPreparation: 3,
  occupiedTables: 3,
  freeTables: 9,
  totalTables: 12,
};

describe('indicadores', () => {
  it('encuentra la hora con más ventas', () => {
    const sales = Array(24).fill(0);
    sales[14] = 800;
    sales[20] = 1200;
    sales[21] = 1200;
    expect(peakHour(sales)).toBe(20);
    expect(peakHour(Array(24).fill(0))).toBeNull();
  });

  it('calcula la ocupación', () => {
    expect(occupancy(stats)).toBe(25);
    expect(occupancy({ ...stats, totalTables: 0, occupiedTables: 0 })).toBe(0);
  });
});

describe('GetDashboardUseCase', () => {
  it('junta estadísticas y ventas por hora', async () => {
    const repository: jest.Mocked<DashboardRepository> = {
      getStats: jest.fn().mockResolvedValue(stats),
      getSalesByHour: jest.fn().mockResolvedValue(Array(24).fill(0)),
    };
    await expect(new GetDashboardUseCase(repository).execute()).resolves.toEqual({
      stats,
      salesByHour: Array(24).fill(0),
    });
  });
});

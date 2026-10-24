import type { HttpClient } from '../../../../core/http/httpClient';
import { DashboardRemoteDataSource } from '../datasources/DashboardRemoteDataSource';
import { DashboardRepositoryImpl } from '../repositories/DashboardRepositoryImpl';

function setup() {
  const http = { get: jest.fn() } as unknown as jest.Mocked<HttpClient>;
  return { http, repository: new DashboardRepositoryImpl(new DashboardRemoteDataSource(http)) };
}

describe('DashboardRepositoryImpl', () => {
  it('lee GET /dashboard/admin/stats', async () => {
    const { http, repository } = setup();
    http.get.mockResolvedValue({
      totalVentas: '1530.50',
      pedidosPendientes: 2,
      pedidosEnPreparacion: 4,
      mesasOcupadas: 5,
      mesasLibres: 7,
      totalMesas: 12,
    });

    await expect(repository.getStats()).resolves.toEqual({
      totalSales: 1530.5,
      pendingOrders: 2,
      ordersInPreparation: 4,
      occupiedTables: 5,
      freeTables: 7,
      totalTables: 12,
    });
    expect(http.get).toHaveBeenCalledWith('dashboard/admin/stats');
  });

  it('lee GET /dashboard/admin/ventas-por-hora y siempre devuelve 24 horas', async () => {
    const { http, repository } = setup();
    http.get.mockResolvedValue({ ventas: [0, '10.5', 20], totalDia: 30.5 });

    const sales = await repository.getSalesByHour();

    expect(http.get).toHaveBeenCalledWith('dashboard/admin/ventas-por-hora');
    expect(sales).toHaveLength(24);
    expect(sales.slice(0, 4)).toEqual([0, 10.5, 20, 0]);
  });

  it('rechaza respuestas inválidas', async () => {
    const { http, repository } = setup();
    http.get.mockResolvedValue(undefined);
    await expect(repository.getStats()).rejects.toMatchObject({ kind: 'server' });
    await expect(repository.getSalesByHour()).rejects.toMatchObject({ kind: 'server' });
  });
});

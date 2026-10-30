import { AppError } from '../../../../core/errors/AppError';
import type { HttpClient } from '../../../../core/http/httpClient';
import { DashboardRemoteDataSource } from '../datasources/DashboardRemoteDataSource';
import { DashboardRepositoryImpl } from '../repositories/DashboardRepositoryImpl';

const NOW = new Date('2026-10-28T20:00:00.000Z');

function setup(get: jest.Mock) {
  return new DashboardRepositoryImpl(
    new DashboardRemoteDataSource({ get } as unknown as HttpClient),
    () => NOW,
  );
}

describe('DashboardRepositoryImpl', () => {
  it('mapea los totales de GET /dashboard/admin/stats', async () => {
    const get = jest.fn().mockResolvedValue({
      totalVentas: 75,
      pedidosPendientes: 0,
      pedidosEnPreparacion: 1,
      mesasOcupadas: 0,
      mesasLibres: 16,
      totalMesas: 16,
    });

    await expect(setup(get).getDailyStats()).resolves.toEqual({
      salesTotal: 75,
      pendingOrders: 0,
      ordersInKitchen: 1,
    });
    expect(get).toHaveBeenCalledWith('dashboard/admin/stats');
  });

  it('un total ilegible o vacío cuenta como 0', async () => {
    const get = jest.fn().mockResolvedValue({
      totalVentas: 'abc',
      pedidosPendientes: null,
      pedidosEnPreparacion: undefined,
    });
    await expect(setup(get).getDailyStats()).resolves.toEqual({
      salesTotal: 0,
      pendingOrders: 0,
      ordersInKitchen: 0,
    });
  });

  it('explica un 403 y deja pasar otros errores', async () => {
    await expect(
      setup(
        jest.fn().mockRejectedValue(new AppError('forbidden', 'Forbidden resource', 403)),
      ).getDailyStats(),
    ).rejects.toThrow('Solo el administrador puede ver el resumen del día.');

    const offline = new AppError('network', 'No hay conexión con el servidor.');
    await expect(setup(jest.fn().mockRejectedValue(offline)).getDailyStats()).rejects.toBe(offline);
  });

  it('pide el mapa de mesas a la hora actual y marca las reservadas', async () => {
    const get = jest.fn().mockResolvedValue([
      { id: 13, numero: 'B01', capacidad: 2, areaNombre: 'Barra', estado: 'disponible' },
      { id: 1, numero: 'S01', capacidad: 4, areaNombre: null, estado: 'ocupada' },
    ]);

    await expect(setup(get).getTableMap()).resolves.toEqual([
      { id: 13, area: 'Barra', reserved: false },
      { id: 1, area: undefined, reserved: true },
    ]);
    expect(get).toHaveBeenCalledWith('reservations/map?fechaHora=2026-10-28T20%3A00%3A00.000Z');
  });

  it('con el reloj por defecto pide el mapa a la hora actual', async () => {
    const get = jest.fn().mockResolvedValue([]);
    await new DashboardRepositoryImpl(
      new DashboardRemoteDataSource({ get } as unknown as HttpClient),
    ).getTableMap();
    expect(get.mock.calls[0][0]).toMatch(/^reservations\/map\?fechaHora=\d{4}-/);
  });
});

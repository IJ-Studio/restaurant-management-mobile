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
      pedidosListos: 2,
      pedidosPorCobrar: 3,
      mesasOcupadas: 0,
      mesasLibres: 16,
      totalMesas: 16,
    });

    await expect(setup(get).getDailyStats()).resolves.toEqual({
      salesTotal: 75,
      pendingOrders: 0,
      ordersInKitchen: 1,
      readyOrders: 2,
      ordersToCharge: 3,
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
      readyOrders: 0,
      ordersToCharge: 0,
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

  it('mapea el resumen detallado de GET /reportes/hoy', async () => {
    const porHora = Array.from({ length: 24 }, () => 0);
    porHora[14] = 450.5;
    const get = jest.fn().mockResolvedValue({
      ventas: {
        cobrado: '450.50',
        propinas: '40.00',
        pagos: 2,
        ordenesPagadas: 2,
        ticketPromedio: '225.25',
        comensales: 5,
      },
      pedidos: { total: 3, porEstatus: { pagada: 2, abierta: 1 } },
      porMetodo: [{ metodo: 'Efectivo', total: '450.50', pagos: 2 }],
      porCajero: [{ nombre: 'Carlos Soto', total: '450.50', pagos: 2 }],
      porMesero: [{ nombre: 'Mariana Pérez', pedidos: 3, total: '600.00', comensales: 5 }],
      porHora,
      topPlatillos: [{ nombre: 'Enchiladas suizas', cantidad: 3, total: '435.00' }],
      ultimosCobros: [
        {
          ordenId: 'o1',
          mesa: null,
          monto: '200.00',
          propina: '0.00',
          metodo: null,
          cajero: null,
          creadoEn: '2026-10-28 20:15:00+00',
        },
      ],
      incidencias: [
        {
          id: '9',
          ordenId: 'o1',
          tipo: 'retraso',
          mensaje: null,
          minutos: 10,
          mesa: 'S01',
          reportadoPor: 'Diego Luna',
          creadoEn: null,
        },
      ],
      mermas: { registros: 1, costo: '35.75' },
      cajasAbiertas: [{ id: 4, cajero: 'Carlos Soto', desde: '2026-10-28 14:00:00+00' }],
    });

    const report = await setup(get).getDailyReport();

    expect(get).toHaveBeenCalledWith('reportes/hoy');
    expect(report.sales).toEqual({
      collected: 450.5,
      tips: 40,
      payments: 2,
      paidOrders: 2,
      averageTicket: 225.25,
      guests: 5,
    });
    expect(report.ordersToday).toBe(3);
    expect(report.byMethod).toEqual([{ method: 'Efectivo', total: 450.5, payments: 2 }]);
    expect(report.byCashier).toEqual([{ name: 'Carlos Soto', total: 450.5, payments: 2 }]);
    expect(report.byWaiter).toEqual([{ name: 'Mariana Pérez', orders: 3, total: 600, guests: 5 }]);
    expect(report.byHour).toHaveLength(24);
    expect(report.byHour[14]).toBe(450.5);
    expect(report.topDishes).toEqual([{ name: 'Enchiladas suizas', quantity: 3, total: 435 }]);
    expect(report.latestPayments).toEqual([
      {
        orderId: 'o1',
        table: undefined,
        amount: 200,
        tip: 0,
        method: undefined,
        cashier: undefined,
        at: '2026-10-28T20:15:00+00:00',
      },
    ]);
    expect(report.incidents).toEqual([
      {
        id: '9',
        orderId: 'o1',
        type: 'retraso',
        message: undefined,
        minutes: 10,
        table: 'S01',
        reportedBy: 'Diego Luna',
        at: undefined,
      },
    ]);
    expect(report.waste).toEqual({ records: 1, cost: 35.75 });
    expect(report.openRegisters).toEqual([
      { id: 4, cashier: 'Carlos Soto', since: '2026-10-28T14:00:00+00:00' },
    ]);
  });

  it('una hora que no llega en el resumen cuenta como 0', async () => {
    const get = jest.fn().mockResolvedValue({
      ventas: {
        cobrado: '0',
        propinas: '0',
        pagos: 0,
        ordenesPagadas: 0,
        ticketPromedio: '0',
        comensales: 0,
      },
      pedidos: { total: 0, porEstatus: {} },
      porMetodo: [],
      porCajero: [],
      porMesero: [],
      porHora: [],
      topPlatillos: [],
      ultimosCobros: [],
      incidencias: [],
      mermas: { registros: 0, costo: '0' },
      cajasAbiertas: [{ id: 1, cajero: null, desde: null }],
    });

    const report = await setup(get).getDailyReport();
    expect(report.byHour).toEqual(Array.from({ length: 24 }, () => 0));
    expect(report.openRegisters).toEqual([{ id: 1, cashier: undefined, since: undefined }]);
  });

  it('con el reloj por defecto pide el mapa a la hora actual', async () => {
    const get = jest.fn().mockResolvedValue([]);
    await new DashboardRepositoryImpl(
      new DashboardRemoteDataSource({ get } as unknown as HttpClient),
    ).getTableMap();
    expect(get.mock.calls[0][0]).toMatch(/^reservations\/map\?fechaHora=\d{4}-/);
  });
});

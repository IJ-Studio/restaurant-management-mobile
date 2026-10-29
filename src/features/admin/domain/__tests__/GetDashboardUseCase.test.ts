import { makeActiveOrder, makeOrderRepository } from '../../../orders/__fixtures__/orders';
import { makeDashboardRepository } from '../../__fixtures__/dashboard';
import { GetDashboardUseCase } from '../usecases/GetDashboardUseCase';

describe('GetDashboardUseCase', () => {
  it('junta totales, pedidos y el estado de cada mesa', async () => {
    const orders = makeOrderRepository();
    orders.listActive.mockResolvedValue([
      makeActiveOrder({ id: 'a', tableNumber: '5' }),
      makeActiveOrder({ id: 'b', tableNumber: '5' }),
      makeActiveOrder({ id: 'c', place: 'Domicilio', tableNumber: undefined }),
    ]);

    const summary = await new GetDashboardUseCase(makeDashboardRepository(), orders).execute();

    expect(summary.stats).toEqual({ salesTotal: 1250.5, pendingOrders: 1, ordersInKitchen: 2 });
    expect(summary.recentOrders.map((o) => o.id)).toEqual(['a', 'b', 'c']);
    // Ordenadas por número natural; un pedido activo pesa más que una reservación.
    expect(summary.tables).toEqual([
      {
        id: 2,
        number: '2',
        name: 'Terraza',
        capacity: 4,
        area: 'Terraza',
        state: 'reservada',
        activeOrders: 0,
      },
      { id: 5, number: '5', capacity: 2, area: 'Salón', state: 'ocupada', activeOrders: 2 },
      { id: 10, number: '10', capacity: 6, area: 'Salón', state: 'libre', activeOrders: 0 },
    ]);
    expect(summary.occupiedTables).toBe(1);
  });

  it('una mesa que no aparece en el mapa queda libre y sin área', async () => {
    const dashboard = makeDashboardRepository();
    dashboard.getTableMap.mockResolvedValue([]);
    const orders = makeOrderRepository();
    orders.listActive.mockResolvedValue([]);

    const summary = await new GetDashboardUseCase(dashboard, orders).execute();

    expect(summary.tables.every((t) => t.state === 'libre' && t.area === undefined)).toBe(true);
    expect(summary.occupiedTables).toBe(0);
  });

  it('si falla una consulta falla el resumen completo', async () => {
    const dashboard = makeDashboardRepository();
    dashboard.getDailyStats.mockRejectedValue(new Error('sin conexión'));

    await expect(new GetDashboardUseCase(dashboard, makeOrderRepository()).execute()).rejects.toThrow(
      'sin conexión',
    );
  });
});

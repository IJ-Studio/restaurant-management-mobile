/**
 * @jest-environment node
 */
import { DashboardRemoteDataSource } from '../../features/admin/data/datasources/DashboardRemoteDataSource';
import { DashboardRepositoryImpl } from '../../features/admin/data/repositories/DashboardRepositoryImpl';
import { CashRegisterRepositoryImpl } from '../../features/cashier/data/CashRegisterRepositoryImpl';
import { recalculate } from '../../shared/domain/Calculation';
import { clienteComo, describeReal } from '../../core/testing/clienteReal';

jest.setTimeout(60_000);

// «Ver cálculo» (Prioridad 1.4): cada desglose que da el API rehace su cifra.
describeReal('móvil contra el API real: «Ver cálculo»', () => {
  it('panel del admin: totales del día y resumen de hoy', async () => {
    const repo = new DashboardRepositoryImpl(new DashboardRemoteDataSource(await clienteComo('admin')));
    const stats = await repo.getDailyStats();
    expect(recalculate(stats.calculations!.salesTotal!)).toBeCloseTo(stats.salesTotal, 2);
    expect(recalculate(stats.calculations!.pendingOrders!)).toBe(stats.pendingOrders);
    expect(recalculate(stats.calculations!.ordersInKitchen!)).toBe(stats.ordersInKitchen);
    expect(recalculate(stats.calculations!.readyOrders!)).toBe(stats.readyOrders);
    expect(recalculate(stats.calculations!.ordersToCharge!)).toBe(stats.ordersToCharge);

    const report = await repo.getDailyReport();
    expect(recalculate(report.calculations!.collected!)).toBe(report.sales.collected);
    expect(recalculate(report.calculations!.tips!)).toBe(report.sales.tips);
    expect(recalculate(report.calculations!.guests!)).toBe(report.sales.guests);
    expect(recalculate(report.calculations!.waste!)).toBe(report.waste.cost);
    expect(recalculate(report.calculations!.averageTicket!)).toBeCloseTo(report.sales.averageTicket, 2);
  });

  it('caja del cajero: cobrado, propinas y efectivo esperado', async () => {
    const repo = new CashRegisterRepositoryImpl(await clienteComo('cajero'));
    const session = (await repo.current()) ?? (await repo.open(100));
    expect(recalculate(session.calculations!.totalSales!)).toBe(session.totalSales);
    expect(recalculate(session.calculations!.tips!)).toBe(session.tips);
    expect(recalculate(session.calculations!.expectedCash!)).toBe(session.expectedCash);
  });
});

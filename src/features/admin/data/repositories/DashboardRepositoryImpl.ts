import { AppError } from '../../../../core/errors/AppError';
import { toIsoTimestamp } from '../../../../shared/utils/apiDate';
import { toIncident } from '../../../kitchen/data/KitchenRepositoryImpl';
import type { DailyReport, DailyStats, TableMapEntry } from '../../domain/entities/DashboardSummary';
import type { DashboardRepository } from '../../domain/repositories/DashboardRepository';
import type { DashboardRemoteDataSource } from '../datasources/DashboardRemoteDataSource';

function toCount(value: number | string | null | undefined): number {
  const count = Number(value ?? 0);
  return Number.isFinite(count) ? count : 0;
}

export class DashboardRepositoryImpl implements DashboardRepository {
  constructor(
    private readonly remote: DashboardRemoteDataSource,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getDailyStats(): Promise<DailyStats> {
    try {
      const dto = await this.remote.getStats();
      return {
        salesTotal: toCount(dto.totalVentas),
        pendingOrders: toCount(dto.pedidosPendientes),
        ordersInKitchen: toCount(dto.pedidosEnPreparacion),
        readyOrders: toCount(dto.pedidosListos),
        ordersToCharge: toCount(dto.pedidosPorCobrar),
      };
    } catch (error) {
      if (error instanceof AppError && error.kind === 'forbidden') {
        throw new AppError('forbidden', 'Solo el administrador puede ver el resumen del día.', error.status);
      }
      throw error;
    }
  }

  async getDailyReport(): Promise<DailyReport> {
    const dto = await this.remote.getDailyReport();
    const iso = (value: string | null | undefined) => (value ? toIsoTimestamp(value) : undefined);
    return {
      sales: {
        collected: toCount(dto.ventas.cobrado),
        tips: toCount(dto.ventas.propinas),
        payments: dto.ventas.pagos,
        paidOrders: dto.ventas.ordenesPagadas,
        averageTicket: toCount(dto.ventas.ticketPromedio),
        guests: dto.ventas.comensales,
      },
      ordersToday: dto.pedidos.total,
      byMethod: dto.porMetodo.map((m) => ({ method: m.metodo, total: toCount(m.total), payments: m.pagos })),
      byCashier: dto.porCajero.map((c) => ({ name: c.nombre, total: toCount(c.total), payments: c.pagos })),
      byWaiter: dto.porMesero.map((w) => ({
        name: w.nombre,
        orders: w.pedidos,
        total: toCount(w.total),
        guests: w.comensales,
      })),
      byHour: Array.from({ length: 24 }, (_, hour) => toCount(dto.porHora[hour])),
      topDishes: dto.topPlatillos.map((d) => ({
        name: d.nombre,
        quantity: d.cantidad,
        total: toCount(d.total),
      })),
      latestPayments: dto.ultimosCobros.map((p) => ({
        orderId: p.ordenId,
        table: p.mesa ?? undefined,
        amount: toCount(p.monto),
        tip: toCount(p.propina),
        method: p.metodo ?? undefined,
        cashier: p.cajero ?? undefined,
        at: iso(p.creadoEn),
      })),
      incidents: dto.incidencias.map(toIncident),
      waste: { records: dto.mermas.registros, cost: toCount(dto.mermas.costo) },
      openRegisters: dto.cajasAbiertas.map((c) => ({
        id: c.id,
        cashier: c.cajero ?? undefined,
        since: iso(c.desde),
      })),
    };
  }

  async getTableMap(): Promise<TableMapEntry[]> {
    const rows = await this.remote.getTableMap(this.now());
    return rows.map((row) => ({
      id: row.id,
      area: row.areaNombre ?? undefined,
      reserved: row.estado === 'ocupada',
    }));
  }
}

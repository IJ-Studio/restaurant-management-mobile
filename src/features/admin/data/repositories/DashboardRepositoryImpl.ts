import { AppError } from '../../../../core/errors/AppError';
import type { DailyStats, TableMapEntry } from '../../domain/entities/DashboardSummary';
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

  async getTableMap(): Promise<TableMapEntry[]> {
    const rows = await this.remote.getTableMap(this.now());
    return rows.map((row) => ({
      id: row.id,
      area: row.areaNombre ?? undefined,
      reserved: row.estado === 'ocupada',
    }));
  }
}

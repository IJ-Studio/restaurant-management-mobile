import { AppError } from '../../../../core/errors/AppError';
import type { DashboardStats } from '../../domain/entities/Dashboard';
import type { DashboardRepository } from '../../domain/repositories/DashboardRepository';
import type { DashboardRemoteDataSource } from '../datasources/DashboardRemoteDataSource';

const toNumber = (value: unknown) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

export class DashboardRepositoryImpl implements DashboardRepository {
  constructor(private readonly remote: DashboardRemoteDataSource) {}

  async getStats(): Promise<DashboardStats> {
    const dto = await this.remote.getStats();
    if (!dto || typeof dto !== 'object') throw new AppError('server', 'Respuesta del dashboard inválida.');
    return {
      totalSales: toNumber(dto.totalVentas),
      pendingOrders: toNumber(dto.pedidosPendientes),
      ordersInPreparation: toNumber(dto.pedidosEnPreparacion),
      occupiedTables: toNumber(dto.mesasOcupadas),
      freeTables: toNumber(dto.mesasLibres),
      totalTables: toNumber(dto.totalMesas),
    };
  }

  async getSalesByHour(): Promise<number[]> {
    const dto = await this.remote.getSalesByHour();
    if (!Array.isArray(dto?.ventas)) throw new AppError('server', 'Respuesta de ventas por hora inválida.');
    // Siempre 24 horas, aunque el API mande menos.
    return Array.from({ length: 24 }, (_, hour) => toNumber(dto.ventas[hour]));
  }
}

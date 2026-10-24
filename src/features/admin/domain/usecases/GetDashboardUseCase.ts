import type { Dashboard } from '../entities/Dashboard';
import type { DashboardRepository } from '../repositories/DashboardRepository';

/** Indicadores del día del Administrador (HU-08). Pide ambos datos en paralelo. */
export class GetDashboardUseCase {
  constructor(private readonly repository: DashboardRepository) {}

  async execute(): Promise<Dashboard> {
    const [stats, salesByHour] = await Promise.all([this.repository.getStats(), this.repository.getSalesByHour()]);
    return { stats, salesByHour };
  }
}

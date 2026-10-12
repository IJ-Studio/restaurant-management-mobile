import type { HttpClient } from '../../../../core/http/httpClient';
import type { AdminStatsDto, SalesByHourDto } from '../dtos/DashboardDto';

export class DashboardRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  getStats(): Promise<AdminStatsDto> {
    return this.http.get<AdminStatsDto>('dashboard/admin/stats');
  }

  getSalesByHour(): Promise<SalesByHourDto> {
    return this.http.get<SalesByHourDto>('dashboard/admin/ventas-por-hora');
  }
}

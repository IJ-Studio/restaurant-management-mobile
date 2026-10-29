import type { HttpClient } from '../../../../core/http/httpClient';
import type { AdminStatsDto, DailyReportDto, TableMapDto } from '../dtos/DashboardDto';

export class DashboardRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  getStats(): Promise<AdminStatsDto> {
    return this.http.get<AdminStatsDto>('dashboard/admin/stats');
  }

  getDailyReport(): Promise<DailyReportDto> {
    return this.http.get<DailyReportDto>('reportes/hoy');
  }

  getTableMap(at: Date): Promise<TableMapDto[]> {
    return this.http.get<TableMapDto[]>(`reservations/map?fechaHora=${encodeURIComponent(at.toISOString())}`);
  }
}

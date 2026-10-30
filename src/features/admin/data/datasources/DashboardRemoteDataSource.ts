import type { HttpClient } from '../../../../core/http/httpClient';
import type { AdminStatsDto, TableMapDto } from '../dtos/DashboardDto';

export class DashboardRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  getStats(): Promise<AdminStatsDto> {
    return this.http.get<AdminStatsDto>('dashboard/admin/stats');
  }

  getTableMap(at: Date): Promise<TableMapDto[]> {
    return this.http.get<TableMapDto[]>(`reservations/map?fechaHora=${encodeURIComponent(at.toISOString())}`);
  }
}

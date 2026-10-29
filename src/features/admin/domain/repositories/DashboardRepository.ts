import type { DailyStats, TableMapEntry } from '../entities/DashboardSummary';

export interface DashboardRepository {
  getDailyStats(): Promise<DailyStats>;
  getTableMap(): Promise<TableMapEntry[]>;
}

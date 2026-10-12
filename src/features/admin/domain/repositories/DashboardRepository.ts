import type { DashboardStats } from '../entities/Dashboard';

export interface DashboardRepository {
  getStats(): Promise<DashboardStats>;
  getSalesByHour(): Promise<number[]>;
}

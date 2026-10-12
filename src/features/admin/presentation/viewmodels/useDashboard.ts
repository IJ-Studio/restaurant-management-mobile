import { useQuery } from '@tanstack/react-query';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { errorMessage } from '../../../../shared/presentation/errorMessage';

/** Se refresca solo cada 30 s mientras la pantalla está abierta. */
export const DASHBOARD_REFETCH_MS = 30_000;

export function useDashboard() {
  const { getDashboardUseCase } = useDependencies();
  const query = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => getDashboardUseCase.execute(),
    refetchInterval: DASHBOARD_REFETCH_MS,
    staleTime: DASHBOARD_REFETCH_MS,
  });

  return {
    dashboard: query.data ?? null,
    isLoading: query.isPending,
    isRefreshing: query.isRefetching,
    // Si ya hay datos, un error de un refresco no tapa el dashboard.
    error: query.isError ? errorMessage(query.error) : null,
    updatedAt: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
    refresh: () => query.refetch(),
  };
}

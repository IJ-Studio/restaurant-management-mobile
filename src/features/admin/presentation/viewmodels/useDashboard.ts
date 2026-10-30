import { useQuery } from '@tanstack/react-query';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';

export const dashboardQueryKeys = { summary: ['dashboard', 'summary'] as const };

/** El resumen se refresca solo cada minuto mientras la pantalla está abierta. */
export const DASHBOARD_REFETCH_INTERVAL = 60 * 1000;

/** ViewModel del Dashboard del administrador: totales, mesas y pedidos activos del día. */
export function useDashboard() {
  const { getDashboardUseCase } = useDependencies();

  const query = useQuery({
    queryKey: dashboardQueryKeys.summary,
    queryFn: () => getDashboardUseCase.execute(),
    staleTime: 30 * 1000,
    refetchInterval: DASHBOARD_REFETCH_INTERVAL,
  });

  return {
    summary: query.data,
    isLoading: query.isPending,
    isRefreshing: query.isRefetching,
    errorMessage: query.error ? userMessage(query.error, 'No se pudo cargar el resumen del día.') : null,
    refresh: () => query.refetch(),
  };
}

import { useQuery } from '@tanstack/react-query';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { reservationQueryKeys } from './reservationQueryKeys';
import { reservationErrorMessage } from './useActiveReservations';

/** ViewModel del historial de reservaciones de los últimos días. Solo consulta cuando se muestra. */
export function useRecentReservations(enabled: boolean) {
  const { listRecentReservationsUseCase } = useDependencies();

  const query = useQuery({
    queryKey: reservationQueryKeys.recent,
    queryFn: () => listRecentReservationsUseCase.execute(),
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  return {
    reservations: query.data ?? [],
    isLoading: enabled && query.isPending,
    isRefreshing: query.isRefetching,
    errorMessage: query.error ? reservationErrorMessage(query.error) : null,
    hasData: query.data !== undefined,
    refresh: () => query.refetch(),
  };
}

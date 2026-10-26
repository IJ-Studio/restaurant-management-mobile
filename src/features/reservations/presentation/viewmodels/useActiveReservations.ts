import { useQuery } from '@tanstack/react-query';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { reservationQueryKeys } from './reservationQueryKeys';

/** ViewModel del listado operativo de reservaciones activas del restaurante. */
export function useActiveReservations() {
  const { listActiveReservationsUseCase } = useDependencies();

  const query = useQuery({
    queryKey: reservationQueryKeys.active,
    queryFn: () => listActiveReservationsUseCase.execute(),
    staleTime: 60 * 1000,
  });

  return {
    reservations: query.data ?? [],
    isLoading: query.isPending,
    isRefreshing: query.isRefetching,
    errorMessage: query.error ? reservationErrorMessage(query.error) : null,
    hasData: query.data !== undefined,
    refresh: () => query.refetch(),
  };
}

export function reservationErrorMessage(error: Error): string {
  return userMessage(error, 'Ocurrió un error con las reservaciones.');
}

import { useQuery } from '@tanstack/react-query';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { errorMessage } from '../../../../shared/presentation/errorMessage';
import { reservationQueryKeys } from './reservationQueryKeys';

export function useActiveReservations() {
  const { getActiveReservationsUseCase } = useDependencies();
  const query = useQuery({
    queryKey: reservationQueryKeys.active,
    queryFn: () => getActiveReservationsUseCase.execute(),
    staleTime: 30_000,
  });

  return {
    reservations: query.data ?? [],
    isLoading: query.isPending,
    isRefreshing: query.isRefetching,
    error: query.isError ? errorMessage(query.error) : null,
    refresh: () => query.refetch(),
  };
}

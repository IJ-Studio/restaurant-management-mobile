import { useQuery } from '@tanstack/react-query';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { errorMessage } from '../../../../shared/presentation/errorMessage';
import { MENU_STALE_TIME, menuQueryKeys } from './menuQueryKeys';

/** ViewModel de la lista del menú (React Query: dato de servidor con caché). */
export function useMenu() {
  const { getMenuUseCase } = useDependencies();
  const query = useQuery({
    queryKey: menuQueryKeys.all,
    queryFn: () => getMenuUseCase.execute(),
    staleTime: MENU_STALE_TIME,
  });

  return {
    dishes: query.data ?? [],
    isLoading: query.isPending,
    isRefreshing: query.isRefetching,
    error: query.isError ? errorMessage(query.error) : null,
    refresh: () => query.refetch(),
  };
}

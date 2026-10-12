import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { errorMessage } from '../../../../shared/presentation/errorMessage';
import type { Dish } from '../../domain/entities/Dish';
import { MENU_STALE_TIME, menuQueryKeys } from './menuQueryKeys';

/**
 * ViewModel del detalle: muestra al instante lo que ya está en la lista y lo confirma con el API.
 * Si el API del detalle falla, se queda con lo de la lista.
 */
export function useDish(id: string) {
  const { getDishUseCase } = useDependencies();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: menuQueryKeys.dish(id),
    queryFn: () => getDishUseCase.execute(id),
    staleTime: MENU_STALE_TIME,
  });
  const fromList = queryClient.getQueryData<Dish[]>(menuQueryKeys.all)?.find((dish) => dish.id === id);
  const dish = query.data ?? fromList ?? null;

  return {
    dish,
    isLoading: query.isPending && !dish,
    error: query.isError && !dish ? errorMessage(query.error) : null,
    refresh: () => query.refetch(),
  };
}

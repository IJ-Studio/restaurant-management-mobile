import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import type { MenuCategory } from '../../domain/entities/Dish';
import { MENU_STALE_TIME, menuQueryKeys } from './menuQueryKeys';
import { errorMessage } from './useMenu';

/** ViewModel del detalle: muestra al instante el platillo que ya está en la caché del menú. */
export function useDish(id: number) {
  const { getDishUseCase } = useDependencies();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: menuQueryKeys.dish(id),
    queryFn: () => getDishUseCase.execute(id),
    staleTime: MENU_STALE_TIME,
    initialData: () =>
      queryClient
        .getQueryData<MenuCategory[]>(menuQueryKeys.all)
        ?.flatMap((category) => category.dishes)
        .find((dish) => dish.id === id),
  });

  return {
    dish: query.data,
    isLoading: query.isPending,
    errorMessage: query.error ? errorMessage(query.error) : null,
    retry: () => query.refetch(),
  };
}

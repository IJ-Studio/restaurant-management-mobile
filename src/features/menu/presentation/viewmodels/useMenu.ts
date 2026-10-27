import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { filterMenu } from '../../domain/entities/menuFilters';
import { MENU_STALE_TIME, menuQueryKeys } from './menuQueryKeys';

/** ViewModel de la lista del menú: datos del servidor (React Query) + búsqueda local. */
export function useMenu() {
  const { getMenuUseCase } = useDependencies();
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: menuQueryKeys.all,
    queryFn: () => getMenuUseCase.execute(),
    staleTime: MENU_STALE_TIME,
  });

  const sections = useMemo(() => filterMenu(query.data ?? [], search), [query.data, search]);

  return {
    sections,
    search,
    setSearch,
    isLoading: query.isPending,
    isRefreshing: query.isRefetching,
    errorMessage: query.error ? errorMessage(query.error) : null,
    hasData: query.data !== undefined,
    refresh: () => query.refetch(),
  };
}

export function errorMessage(error: Error): string {
  return userMessage(error, 'No se pudo cargar el menú.');
}

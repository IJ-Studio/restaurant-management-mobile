import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { useSession } from '../../../auth/presentation/viewmodels/useSession';
import { canManageOrders } from '../../domain/entities/ActiveOrder';
import { ORDERS_REFETCH_INTERVAL, orderQueryKeys } from './orderQueryKeys';

/** `all`, o un estatus: `pendiente` (por confirmar) y `abierta` (en cocina). */
export type OrderFilter = 'all' | 'pendiente' | 'abierta';

/** ViewModel de la lista de pedidos activos del día, con filtro por estatus. */
export function useActiveOrders() {
  const { listActiveOrdersUseCase } = useDependencies();
  const role = useSession((state) => state.session?.user.role);
  const [filter, setFilter] = useState<OrderFilter>('all');

  const query = useQuery({
    queryKey: orderQueryKeys.active,
    queryFn: () => listActiveOrdersUseCase.execute(),
    staleTime: 15 * 1000,
    refetchInterval: ORDERS_REFETCH_INTERVAL,
  });

  const { visible, counts } = useMemo(() => {
    const all = query.data ?? [];
    return {
      visible: filter === 'all' ? all : all.filter((order) => order.status === filter),
      counts: {
        all: all.length,
        pendiente: all.filter((order) => order.status === 'pendiente').length,
        abierta: all.filter((order) => order.status === 'abierta').length,
      } satisfies Record<OrderFilter, number>,
    };
  }, [query.data, filter]);

  return {
    orders: visible,
    counts,
    filter,
    setFilter,
    /** Cocina solo consulta: el API no le deja abrir ni cambiar pedidos. */
    canManage: canManageOrders(role),
    isLoading: query.isPending,
    isRefreshing: query.isRefetching,
    errorMessage: query.error ? ordersErrorMessage(query.error) : null,
    hasData: query.data !== undefined,
    refresh: () => query.refetch(),
  };
}

export function ordersErrorMessage(error: Error): string {
  return userMessage(error, 'No se pudieron cargar los pedidos.');
}

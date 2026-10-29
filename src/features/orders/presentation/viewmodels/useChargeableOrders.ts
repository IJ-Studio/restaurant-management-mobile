import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { CHARGEABLE_STATUSES, type ActiveOrder } from '../../domain/entities/ActiveOrder';
import { ORDERS_REFETCH_INTERVAL, orderQueryKeys } from './orderQueryKeys';
import { ordersErrorMessage } from './useActiveOrders';

/** Primero lo que ya se sirvió (el cliente está esperando la cuenta), luego lo listo y lo que va en cocina. */
const PRIORITY: Record<string, number> = {
  entregada: 0,
  para_cobrar: 0,
  lista: 1,
  en_preparacion: 2,
  abierta: 3,
};

const opened = (order: ActiveOrder) => (order.openedAt ? new Date(order.openedAt).getTime() : 0);

/** ViewModel de Cobros: pedidos del día que caja puede cobrar. Comparte la caché con Pedidos. */
export function useChargeableOrders() {
  const { listActiveOrdersUseCase } = useDependencies();

  const query = useQuery({
    queryKey: orderQueryKeys.active,
    queryFn: () => listActiveOrdersUseCase.execute(),
    staleTime: 15 * 1000,
    refetchInterval: ORDERS_REFETCH_INTERVAL,
  });

  const orders = useMemo(
    () =>
      (query.data ?? [])
        .filter((order) => CHARGEABLE_STATUSES.includes(order.status))
        .sort((a, b) => (PRIORITY[a.status] ?? 9) - (PRIORITY[b.status] ?? 9) || opened(a) - opened(b)),
    [query.data],
  );

  return {
    orders,
    pendingTotal: orders.reduce((sum, order) => sum + order.total, 0),
    isLoading: query.isPending,
    isRefreshing: query.isRefetching,
    errorMessage: query.error ? ordersErrorMessage(query.error) : null,
    hasData: query.data !== undefined,
    refresh: () => query.refetch(),
  };
}

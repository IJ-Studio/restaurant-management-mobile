import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import { useSession } from '../../../auth/presentation/viewmodels/useSession';
import {
  canOpenOrder,
  isKitchen,
  KITCHEN_STATUSES,
  quickAction,
  type ActiveOrder,
} from '../../domain/entities/ActiveOrder';
import { STEP_FOR } from '../components/orderLabels';
import { ORDERS_REFETCH_INTERVAL, orderQueryKeys, refreshOrderData } from './orderQueryKeys';

export interface OrderFilter {
  key: string;
  label: string;
  /** Estatus que entran en el filtro; null = todos. */
  statuses: readonly string[] | null;
}

/** Cocina ve su cola de trabajo; el resto ve todo el recorrido del pedido. */
const KITCHEN_FILTERS: OrderFilter[] = [
  { key: 'all', label: 'Todos', statuses: KITCHEN_STATUSES },
  { key: 'nuevos', label: 'Por preparar', statuses: ['abierta'] },
  { key: 'preparando', label: 'Preparando', statuses: ['en_preparacion'] },
  { key: 'listos', label: 'Listos', statuses: ['lista'] },
];

const FLOOR_FILTERS: OrderFilter[] = [
  { key: 'all', label: 'Todos', statuses: null },
  { key: 'pendiente', label: 'Por confirmar', statuses: ['pendiente'] },
  { key: 'cocina', label: 'En cocina', statuses: ['abierta', 'en_preparacion'] },
  { key: 'listos', label: 'Listos', statuses: ['lista'] },
  { key: 'cobrar', label: 'Por cobrar', statuses: ['entregada', 'para_cobrar'] },
];

const matches = (filter: OrderFilter, order: ActiveOrder) =>
  filter.statuses === null || filter.statuses.includes(order.status);

const openedTime = (order: ActiveOrder) => (order.openedAt ? new Date(order.openedAt).getTime() : 0);

/** ViewModel de la lista de pedidos activos del día: filtros por rol y la acción rápida de cada tarjeta. */
export function useActiveOrders() {
  const { listActiveOrdersUseCase, updateOrderStatusUseCase } = useDependencies();
  const role = useSession((state) => state.session?.user.role);
  const queryClient = useQueryClient();
  const kitchen = isKitchen(role);
  const filters = kitchen ? KITCHEN_FILTERS : FLOOR_FILTERS;
  const [filterKey, setFilter] = useState('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: orderQueryKeys.active,
    queryFn: () => listActiveOrdersUseCase.execute(),
    staleTime: 15 * 1000,
    refetchInterval: ORDERS_REFETCH_INTERVAL,
  });

  const advance = useMutation({
    mutationFn: (order: ActiveOrder) => {
      const action = quickAction(role, order);
      const step = action ? STEP_FOR[action] : undefined;
      if (!step) throw new Error('Este pedido no tiene un siguiente paso.');
      return updateOrderStatusUseCase.execute(order.id, step);
    },
    onMutate: () => {
      setNotice(null);
      setActionError(null);
    },
    onSuccess: (message) => {
      feedback.success();
      setNotice(message);
      // Sin esperar: la confirmación se muestra al instante y las listas se ponen al día detrás.
      void refreshOrderData(queryClient);
    },
    onError: (error) => {
      feedback.error();
      setActionError(userMessage(error, 'No se pudo actualizar el pedido.'));
    },
  });

  const filter = filters.find((f) => f.key === filterKey) ?? filters[0];

  const { visible, counts } = useMemo(() => {
    const all = query.data ?? [];
    // Cocina trabaja por orden de llegada: el que lleva más tiempo esperando va primero.
    const base = kitchen
      ? all
          .filter((order) => KITCHEN_STATUSES.includes(order.status))
          .sort((a, b) => openedTime(a) - openedTime(b))
      : all;
    return {
      visible: base.filter((order) => matches(filter, order)),
      counts: Object.fromEntries(
        filters.map((f) => [f.key, base.filter((order) => matches(f, order)).length]),
      ),
    };
  }, [query.data, filter, filters, kitchen]);

  return {
    orders: visible,
    filters,
    counts,
    filter: filter.key,
    setFilter,
    kitchen,
    canOpen: canOpenOrder(role),
    quickActionFor: (order: ActiveOrder) => quickAction(role, order),
    runQuickAction: (order: ActiveOrder) => advance.mutate(order),
    busyOrderId: advance.isPending ? advance.variables?.id : undefined,
    notice,
    actionError,
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

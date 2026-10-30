import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import { useSession } from '../../../auth/presentation/viewmodels/useSession';
import { availableActions, type OrderAction } from '../../domain/entities/ActiveOrder';
import type { OrderStep } from '../../domain/repositories/OrderRepository';
import { orderQueryKeys, refreshOrderData } from './orderQueryKeys';

/** ViewModel del detalle de un pedido: sus platillos y las acciones que el rol puede hacer ahora. */
export function useOrderDetail(orderId: string, now: () => Date = () => new Date()) {
  const deps = useDependencies();
  const role = useSession((state) => state.session?.user.role);
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => deps.getOrderDetailUseCase.execute(orderId),
  });

  // Cada acción limpia el aviso anterior y, al terminar, refresca listas, detalle y Dashboard.
  const handlers = {
    onMutate: () => {
      setNotice(null);
      setActionError(null);
    },
    onSuccess: (message: string) => {
      feedback.success();
      setNotice(message);
      return refreshOrderData(queryClient);
    },
    onError: (error: Error) => {
      feedback.error();
      setActionError(userMessage(error, 'No se pudo actualizar el pedido.'));
    },
  };

  const confirm = useMutation({
    mutationFn: async () => (await deps.confirmOrderUseCase.execute(orderId)).message,
    ...handlers,
  });
  const cancel = useMutation({ mutationFn: () => deps.cancelOrderUseCase.execute(orderId), ...handlers });
  const removeItem = useMutation({
    mutationFn: (itemId: number) => deps.removeOrderItemUseCase.execute(itemId),
    ...handlers,
  });
  const step = useMutation({
    mutationFn: (next: OrderStep) => deps.updateOrderStatusUseCase.execute(orderId, next),
    ...handlers,
  });

  const order = query.data;
  const actions: OrderAction[] = order ? availableActions(role, order, now()) : [];
  const can = (action: OrderAction) => actions.includes(action);

  return {
    order,
    isLoading: query.isPending,
    isRefreshing: query.isRefetching,
    errorMessage: query.error ? userMessage(query.error, 'No se pudo cargar el pedido.') : null,
    refresh: () => query.refetch(),
    can,
    confirm: () => confirm.mutate(),
    cancel: () => cancel.mutate(),
    removeItem: (itemId: number) => removeItem.mutate(itemId),
    advance: (next: OrderStep) => step.mutate(next),
    /** La acción que se está mandando, para mostrar el indicador en su botón. */
    busy: confirm.isPending
      ? 'confirm'
      : cancel.isPending
        ? 'cancel'
        : step.isPending
          ? step.variables
          : undefined,
    removingItemId: removeItem.isPending ? removeItem.variables : undefined,
    notice,
    actionError,
  };
}

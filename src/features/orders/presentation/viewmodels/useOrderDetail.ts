import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { useSession } from '../../../auth/presentation/viewmodels/useSession';
import { availableActions } from '../../domain/entities/ActiveOrder';
import { orderQueryKeys } from './orderQueryKeys';

/** ViewModel del detalle de un pedido: sus platillos y las acciones que el rol puede hacer. */
export function useOrderDetail(tableNumber: string, orderId: string, now: () => Date = () => new Date()) {
  const deps = useDependencies();
  const role = useSession((state) => state.session?.user.role);
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => deps.getOrderDetailUseCase.execute(tableNumber, orderId),
  });

  // Cada acción limpia el aviso anterior y, al terminar, refresca la lista y el detalle.
  const handlers = {
    onMutate: () => {
      setNotice(null);
      setActionError(null);
    },
    onSuccess: (message: string) => {
      setNotice(message);
      return queryClient.invalidateQueries({ queryKey: orderQueryKeys.all });
    },
    onError: (error: Error) => setActionError(userMessage(error, 'No se pudo actualizar el pedido.')),
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

  const order = query.data;
  const actions = order ? availableActions(role, order, now()) : [];

  return {
    order,
    isLoading: query.isPending,
    isRefreshing: query.isRefetching,
    errorMessage: query.error ? userMessage(query.error, 'No se pudo cargar el pedido.') : null,
    refresh: () => query.refetch(),
    canConfirm: actions.includes('confirm'),
    canCancel: actions.includes('cancel'),
    canRemoveItems: actions.includes('remove-item'),
    confirm: () => confirm.mutate(),
    cancel: () => cancel.mutate(),
    removeItem: (itemId: number) => removeItem.mutate(itemId),
    isConfirming: confirm.isPending,
    isCancelling: cancel.isPending,
    removingItemId: removeItem.isPending ? removeItem.variables : undefined,
    notice,
    actionError,
  };
}

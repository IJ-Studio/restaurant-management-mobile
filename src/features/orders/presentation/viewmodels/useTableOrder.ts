import { useMutation, useQuery } from '@tanstack/react-query';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { estimatedTotal, itemCount } from '../../domain/entities/TableOrder';
import { useCurrentOrder } from './useCurrentOrder';

/** ViewModel del pedido de la mesa: mesas (React Query), pedido local (Zustand) y envío a cocina. */
export function useTableOrder() {
  const { listTablesUseCase, sendOrderToKitchenUseCase, currentOrderStore, sessionStore } = useDependencies();
  const order = useCurrentOrder((state) => state.order);

  const tables = useQuery({
    queryKey: ['tables'],
    queryFn: () => listTablesUseCase.execute(),
    staleTime: 10 * 60 * 1000,
  });

  const send = useMutation({
    mutationFn: () => {
      const waiterId = Number(sessionStore.getState().session?.user.id);
      return sendOrderToKitchenUseCase.execute(currentOrderStore.getState().order, waiterId);
    },
    onSuccess: () => currentOrderStore.getState().clear(),
  });

  const actions = currentOrderStore.getState();

  return {
    order,
    count: itemCount(order),
    total: estimatedTotal(order),
    tables: tables.data ?? [],
    tablesError: tables.error ? toMessage(tables.error) : null,
    selectTable: actions.setTable,
    setQuantity: actions.setQuantity,
    remove: actions.remove,
    sendToKitchen: () => send.mutate(),
    isSending: send.isPending,
    sendError: send.error ? toMessage(send.error) : null,
    sentMessage: send.data?.message ?? null,
  };
}

function toMessage(error: Error): string {
  return userMessage(error, 'No se pudo enviar el pedido.');
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import type { FloorTable, FloorTableState } from '../../../../shared/presentation/components/FloorMap';
import { feedback } from '../../../../shared/presentation/feedback';
import { estimatedTotal, itemCount } from '../../domain/entities/TableOrder';
import { orderQueryKeys, refreshOrderData } from './orderQueryKeys';
import { useCurrentOrder } from './useCurrentOrder';

/** Estado de la mesa en el plano según sus pedidos activos (el más avanzado manda). */
function stateFor(statuses: string[]): FloorTableState {
  if (statuses.some((status) => status === 'entregada' || status === 'para_cobrar')) return 'por_cobrar';
  return statuses.length > 0 ? 'ocupada' : 'libre';
}

/** ViewModel del pedido de la mesa: mesas (React Query), pedido local (Zustand) y envío a cocina. */
export function useTableOrder() {
  const {
    listTablesUseCase,
    listActiveOrdersUseCase,
    sendOrderToKitchenUseCase,
    currentOrderStore,
    sessionStore,
  } = useDependencies();
  const order = useCurrentOrder((state) => state.order);
  const queryClient = useQueryClient();

  const tables = useQuery({
    queryKey: ['tables'],
    queryFn: () => listTablesUseCase.execute(),
    staleTime: 10 * 60 * 1000,
  });
  // Comparte la caché con la pestaña Pedidos: el plano marca las mesas que ya tienen pedido.
  const active = useQuery({
    queryKey: orderQueryKeys.active,
    queryFn: () => listActiveOrdersUseCase.execute(),
    staleTime: 15 * 1000,
  });

  const floor: FloorTable[] = useMemo(() => {
    const byTable = new Map<string, string[]>();
    for (const activeOrder of active.data ?? []) {
      if (!activeOrder.tableNumber) continue;
      byTable.set(activeOrder.tableNumber, [
        ...(byTable.get(activeOrder.tableNumber) ?? []),
        activeOrder.status,
      ]);
    }
    return (tables.data ?? []).map((table) => ({
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      shape: table.shape,
      area: table.area,
      state: stateFor(byTable.get(table.number) ?? []),
    }));
  }, [tables.data, active.data]);

  const send = useMutation({
    mutationFn: () => {
      const waiterId = Number(sessionStore.getState().session?.user.id);
      return sendOrderToKitchenUseCase.execute(currentOrderStore.getState().order, waiterId);
    },
    onSuccess: () => {
      feedback.success();
      currentOrderStore.getState().clear();
      // Sin esperar: la confirmación se muestra al instante y las listas se ponen al día detrás.
      void refreshOrderData(queryClient);
    },
    onError: () => feedback.error(),
  });

  const actions = currentOrderStore.getState();

  return {
    order,
    count: itemCount(order),
    total: estimatedTotal(order),
    guests: order.guests ?? 1,
    tables: tables.data ?? [],
    floor,
    tablesError: tables.error ? toMessage(tables.error) : null,
    selectTable: (tableNumber: string) => {
      feedback.select();
      actions.setTable(tableNumber);
    },
    setQuantity: actions.setQuantity,
    setGuests: actions.setGuests,
    setKitchenNote: actions.setKitchenNote,
    setLineNotes: actions.setLineNotes,
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

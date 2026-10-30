import type { QueryClient } from '@tanstack/react-query';

export const orderQueryKeys = {
  all: ['orders'] as const,
  active: ['orders', 'active'] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
  paymentMethods: ['payment-methods'] as const,
};

/** Cocina y piso necesitan ver los pedidos casi en vivo, como el stream de 30 s del panel web. */
export const ORDERS_REFETCH_INTERVAL = 30 * 1000;

/** Después de cambiar un pedido se refrescan las listas, su detalle y el Dashboard. */
export function refreshOrderData(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: orderQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  ]);
}

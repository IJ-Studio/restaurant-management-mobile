export const orderQueryKeys = {
  all: ['orders'] as const,
  active: ['orders', 'active'] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
};

/** Cocina y piso necesitan ver los pedidos casi en vivo, como el stream de 30 s del panel web. */
export const ORDERS_REFETCH_INTERVAL = 30 * 1000;

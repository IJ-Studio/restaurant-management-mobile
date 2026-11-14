import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { useSession } from '../../../auth/presentation/viewmodels/useSession';
import type { ActiveOrder } from '../../domain/entities/ActiveOrder';
import { statusAfter, type OrderEvent } from '../../domain/entities/OrderEvent';
import { orderQueryKeys, refreshOrderData } from './orderQueryKeys';

/**
 * Aplica un evento a la caché: si ya se sabe el estatus nuevo, la lista cambia al instante
 * (`setQueryData`); en todo caso se vuelven a pedir los datos afectados para quedar exactos.
 */
export function applyOrderEvent(queryClient: QueryClient, event: OrderEvent): Promise<unknown> {
  const status = statusAfter(event);
  if (status) {
    queryClient.setQueryData<ActiveOrder[]>(orderQueryKeys.active, (orders) =>
      orders?.map((order) => (order.id === event.orderId ? { ...order, status } : order)),
    );
  }
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: orderQueryKeys.active }),
    queryClient.invalidateQueries({ queryKey: orderQueryKeys.detail(event.orderId) }),
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  ]);
}

/**
 * Observer de los pedidos en tiempo real (HU-06): mientras hay sesión, escucha el flujo del API y
 * mantiene al día la lista y el detalle sin que nadie refresque. Si se reconecta, sincroniza todo
 * una vez. El sondeo de las consultas queda como respaldo si el flujo no está disponible.
 */
export function useOrderEvents() {
  const { orderEvents } = useDependencies();
  const queryClient = useQueryClient();
  // Con un token nuevo (refresco de sesión) se abre un flujo nuevo.
  const token = useSession((state) => state.session?.token);

  useEffect(() => {
    if (!token) return undefined;
    let firstReady = true;
    return orderEvents.subscribe({
      onReady: () => {
        if (!firstReady) void refreshOrderData(queryClient);
        firstReady = false;
      },
      onEvent: (event) => {
        void applyOrderEvent(queryClient, event);
      },
    });
  }, [orderEvents, queryClient, token]);
}

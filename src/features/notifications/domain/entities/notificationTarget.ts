import type { IncomingNotification } from '../ports/PushNotifications';

/** Tipos de aviso que manda el API al cambiar el estado de un pedido (`data.type`). */
export const ORDER_NOTIFICATION_TYPES = ['order_ready', 'order_delivered'] as const;

/**
 * Pedido al que lleva un aviso, o `null` si el aviso no es de un pedido. El contenido llega de
 * fuera de la app: solo se acepta un tipo conocido y un id con forma de identificador.
 */
export function orderIdFromNotification(notification: IncomingNotification): string | null {
  const { type, orderId } = notification.data;
  if (!(ORDER_NOTIFICATION_TYPES as readonly unknown[]).includes(type)) return null;
  return typeof orderId === 'string' && /^[A-Za-z0-9-]{1,64}$/.test(orderId) ? orderId : null;
}

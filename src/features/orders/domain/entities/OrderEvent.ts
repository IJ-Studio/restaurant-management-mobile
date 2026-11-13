import type { OrderStatus } from './ActiveOrder';

/** Qué le pasó al pedido, según el flujo en tiempo real del API (`GET /pedidos/stream`). */
export type OrderChange = 'items' | 'sent' | 'status' | 'cancelled' | 'charged';

export interface OrderEvent {
  change: OrderChange;
  orderId: string;
  /** Estatus nuevo, cuando el cambio lo trae. */
  status?: OrderStatus;
}

const CHANGES: readonly OrderChange[] = ['items', 'sent', 'status', 'cancelled', 'charged'];
const STATUSES: readonly OrderStatus[] = [
  'pendiente',
  'abierta',
  'en_preparacion',
  'lista',
  'entregada',
  'pagada',
  'completada',
  'cancelada',
];

/** Valida lo que llega por el flujo: viene de fuera de la app y puede no tener la forma esperada. */
export function parseOrderEvent(raw: unknown): OrderEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const { change, orderId, estatus } = raw as Record<string, unknown>;
  if (!CHANGES.includes(change as OrderChange)) return null;
  if (typeof orderId !== 'string' || !orderId) return null;
  const status = STATUSES.includes(estatus as OrderStatus) ? (estatus as OrderStatus) : undefined;
  return { change: change as OrderChange, orderId, ...(status ? { status } : {}) };
}

/** Estatus en que queda el pedido tras el evento, si se sabe sin preguntarle al API. */
export function statusAfter(event: OrderEvent): OrderStatus | null {
  if (event.change === 'status') return event.status ?? null;
  if (event.change === 'sent') return 'abierta';
  if (event.change === 'cancelled') return 'cancelada';
  return null;
}

import type { Role } from '../../../auth/domain/entities/Role';

/**
 * Estatus de `ordenes` en el API: `pendiente` (carrito, aún no va a cocina), `abierta` (en cocina),
 * `pagada`, `entregada`, `completada` y `cancelada`. Puede llegar otro, por eso también se acepta string.
 */
export type OrderStatus = 'pendiente' | 'abierta' | 'pagada' | 'entregada' | 'completada' | 'cancelada';

/** Pedido activo del día, como lo resume GET /pedidos/admin/recent. */
export interface ActiveOrder {
  id: string;
  customer: string;
  /** Hora de apertura ya formateada por el API ("08:25 p.m."). */
  time: string;
  /** Primer platillo del pedido. */
  firstItem: string;
  /** "Mesa B01", "Domicilio"… */
  place: string;
  /** Número de la mesa ("B01"); no hay en pedidos a domicilio. */
  tableNumber?: string;
  status: OrderStatus | string;
  total: number;
}

export interface OrderItem {
  /** Id de la fila en `orden_items`: es el que se usa para quitarlo. */
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

/** Pedido con sus platillos (GET /pedidos/usuario?mesaId=…). */
export interface OrderDetail {
  id: string;
  tableNumber: string;
  status: OrderStatus | string;
  total: number;
  /** ISO 8601. */
  openedAt?: string;
  items: OrderItem[];
}

export type OrderAction = 'confirm' | 'cancel' | 'remove-item';

/** El API solo deja cancelar un pedido en cocina durante sus primeros 2 minutos. */
export const CANCEL_WINDOW_MS = 2 * 60 * 1000;

/** Roles que el API deja operar pedidos de mesa (STAFF_ROLES del API). Cocina solo los consulta. */
const ORDER_MANAGERS: readonly Role[] = ['admin', 'cajero', 'mesero'];

export function canManageOrders(role: Role | undefined): boolean {
  return role !== undefined && ORDER_MANAGERS.includes(role);
}

/** Acciones que el rol puede hacer sobre el pedido en este momento; las mismas reglas que valida el API. */
export function availableActions(
  role: Role | undefined,
  order: Pick<OrderDetail, 'status' | 'openedAt' | 'items'>,
  now: Date,
): OrderAction[] {
  if (!canManageOrders(role)) return [];
  if (order.status === 'pendiente') {
    return order.items.length > 0 ? ['confirm', 'remove-item'] : ['remove-item'];
  }
  if (order.status === 'abierta' && order.openedAt) {
    const elapsed = now.getTime() - new Date(order.openedAt).getTime();
    if (elapsed >= 0 && elapsed <= CANCEL_WINDOW_MS) return ['cancel'];
  }
  return [];
}

/** Número de mesa a partir de "Mesa B01"; undefined para domicilio o sin mesa. */
export function tableNumberFromPlace(place: string): string | undefined {
  const match = /^Mesa\s+(.+)$/i.exec(place.trim());
  return match ? match[1] : undefined;
}

import type { Role } from '../../../auth/domain/entities/Role';

/**
 * Estatus de `ordenes` en el API, en el orden en que avanza un pedido de mesa:
 * `pendiente` (carrito) → `abierta` (enviado a cocina) → `en_preparacion` → `lista` →
 * `entregada` (en la mesa, falta cobrar) → `pagada`. También puede quedar `cancelada`.
 */
export type OrderStatus =
  'pendiente' | 'abierta' | 'en_preparacion' | 'lista' | 'entregada' | 'pagada' | 'completada' | 'cancelada';

export interface OrderItemSummary {
  name: string;
  quantity: number;
}

/** Pedido activo del día, como lo resume GET /pedidos/admin/recent. */
export interface ActiveOrder {
  id: string;
  customer: string;
  /** Hora de apertura ya formateada por el API ("08:25 p.m."). */
  time: string;
  /** ISO 8601; sirve para calcular cuánto lleva esperando. */
  openedAt?: string;
  /** Primer platillo del pedido. */
  firstItem: string;
  /** Todos los platillos (cocina los necesita para preparar). */
  items: OrderItemSummary[];
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
  notes?: string;
  imageUrl?: string;
}

/** Pedido con sus platillos (GET /pedidos/:id). */
export interface OrderDetail {
  id: string;
  /** Número de mesa; no hay en pedidos a domicilio. */
  tableNumber?: string;
  status: OrderStatus | string;
  total: number;
  tip: number;
  /** ISO 8601. */
  openedAt?: string;
  kitchenNotes?: string;
  items: OrderItem[];
}

export type OrderAction = 'confirm' | 'remove-item' | 'cancel' | 'start' | 'ready' | 'deliver' | 'charge';

/** El API solo deja cancelar un pedido en cocina durante sus primeros 2 minutos. */
export const CANCEL_WINDOW_MS = 2 * 60 * 1000;

/** Un pedido en cocina que lleva más de esto esperando se marca como demorado. */
export const LATE_AFTER_MS = 20 * 60 * 1000;

/** Estatus en los que caja puede cobrar (ESTATUS_COBRABLES del API). */
export const CHARGEABLE_STATUSES: readonly string[] = [
  'abierta',
  'en_preparacion',
  'lista',
  'entregada',
  'para_cobrar',
];

/** Estatus que cocina tiene que atender. */
export const KITCHEN_STATUSES: readonly string[] = ['abierta', 'en_preparacion', 'lista'];

// Qué rol hace cada parte del flujo (las mismas reglas que valida el API).
const FLOOR: readonly Role[] = ['admin', 'cajero', 'mesero'];
const KITCHEN: readonly Role[] = ['admin', 'cocina'];
const CASHIER: readonly Role[] = ['admin', 'cajero'];

const isIn = (role: Role | undefined, roles: readonly Role[]) => role !== undefined && roles.includes(role);

/** Todo el personal puede abrir el detalle de un pedido. */
export function canOpenOrder(role: Role | undefined): boolean {
  return isIn(role, ['admin', 'cajero', 'mesero', 'cocina']);
}

export function canCharge(role: Role | undefined): boolean {
  return isIn(role, CASHIER);
}

export function isKitchen(role: Role | undefined): boolean {
  return role === 'cocina';
}

/** Acciones que el rol puede hacer sobre el pedido en este momento. */
type ActionableOrder = Pick<OrderDetail, 'status' | 'openedAt'> & { items: unknown[] };

/** Piso: confirma y ajusta el carrito, cancela lo recién enviado y entrega lo listo. */
function floorActions(order: ActionableOrder, now: Date): OrderAction[] {
  if (order.status === 'pendiente') {
    return order.items.length > 0 ? ['confirm', 'remove-item'] : ['remove-item'];
  }
  if (order.status === 'lista') return ['deliver'];
  if (order.status !== 'abierta' || !order.openedAt) return [];
  const elapsed = now.getTime() - new Date(order.openedAt).getTime();
  return elapsed >= 0 && elapsed <= CANCEL_WINDOW_MS ? ['cancel'] : [];
}

/** Cocina: empieza lo recién llegado y marca lo terminado. */
function kitchenActions(order: ActionableOrder): OrderAction[] {
  if (order.status === 'abierta') return ['start', 'ready'];
  if (order.status === 'en_preparacion') return ['ready'];
  return [];
}

export function availableActions(role: Role | undefined, order: ActionableOrder, now: Date): OrderAction[] {
  return [
    ...(isIn(role, FLOOR) ? floorActions(order, now) : []),
    ...(isIn(role, KITCHEN) ? kitchenActions(order) : []),
    ...(isIn(role, CASHIER) && CHARGEABLE_STATUSES.includes(order.status) ? (['charge'] as const) : []),
  ];
}

/** La acción principal que se ofrece en la tarjeta de la lista, si hay una. */
export function quickAction(
  role: Role | undefined,
  order: Pick<ActiveOrder, 'status'>,
): OrderAction | undefined {
  if (isIn(role, KITCHEN) && order.status === 'abierta') return 'start';
  if (isIn(role, KITCHEN) && order.status === 'en_preparacion') return 'ready';
  if (isIn(role, FLOOR) && order.status === 'lista') return 'deliver';
  return undefined;
}

/** Minutos desde que se abrió el pedido; undefined si no hay hora. */
export function minutesOpen(openedAt: string | undefined, now: Date): number | undefined {
  if (!openedAt) return undefined;
  const ms = now.getTime() - new Date(openedAt).getTime();
  return Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 60000)) : undefined;
}

/** Número de mesa a partir de "Mesa B01"; undefined para domicilio o sin mesa. */
export function tableNumberFromPlace(place: string): string | undefined {
  const match = /^Mesa\s+(.+)$/i.exec(place.trim());
  return match ? match[1] : undefined;
}

/**
 * Pedido en curso de una mesa: 100% local hasta enviarse a cocina/cobro (HU-05).
 * Funciones puras: el store de Zustand solo las aplica.
 */
export interface OrderLine {
  dishId: string;
  name: string;
  /** Precio unitario mostrado en el menú. El monto real del cobro lo calcula el API. */
  unitPrice: number;
  quantity: number;
}

export interface CurrentOrder {
  table: string;
  lines: OrderLine[];
}

export interface OrderableDish {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export const MAX_QUANTITY = 99;

const clampQuantity = (quantity: number) => Math.min(Math.max(Math.trunc(quantity), 0), MAX_QUANTITY);

export function emptyOrder(table: string): CurrentOrder {
  return { table, lines: [] };
}

/** Agrega un platillo; si ya está, suma la cantidad. Un platillo agotado no se agrega. */
export function addDish(order: CurrentOrder, dish: OrderableDish, quantity = 1): CurrentOrder {
  if (!dish.available || quantity < 1) return order;
  const existing = order.lines.find((line) => line.dishId === dish.id);
  if (existing) return setQuantity(order, dish.id, existing.quantity + quantity);
  const line: OrderLine = { dishId: dish.id, name: dish.name, unitPrice: dish.price, quantity: clampQuantity(quantity) };
  return { ...order, lines: [...order.lines, line] };
}

/** Cambia la cantidad de un platillo; con 0 o menos se quita del pedido. */
export function setQuantity(order: CurrentOrder, dishId: string, quantity: number): CurrentOrder {
  const next = clampQuantity(quantity);
  if (next === 0) return removeDish(order, dishId);
  return {
    ...order,
    lines: order.lines.map((line) => (line.dishId === dishId ? { ...line, quantity: next } : line)),
  };
}

export function removeDish(order: CurrentOrder, dishId: string): CurrentOrder {
  return { ...order, lines: order.lines.filter((line) => line.dishId !== dishId) };
}

export function itemCount(order: CurrentOrder): number {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Total estimado en pesos, redondeado a centavos. */
export function orderTotal(order: CurrentOrder): number {
  const cents = order.lines.reduce((sum, line) => sum + Math.round(line.unitPrice * 100) * line.quantity, 0);
  return cents / 100;
}

/** Mesa: número del 1 al 999 (lo que se pinta en la mesa). */
export function normalizeTable(input: string): string | null {
  const value = input.trim();
  if (!/^\d{1,3}$/.test(value) || Number(value) < 1) return null;
  return String(Number(value));
}

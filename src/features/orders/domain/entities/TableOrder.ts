export interface OrderLine {
  dishId: number;
  name: string;
  /** Precio mostrado al mesero; el total real lo calcula el servidor. */
  unitPrice: number;
  quantity: number;
}

export interface TableOrder {
  tableNumber: string | null;
  lines: OrderLine[];
}

export interface Table {
  id: number;
  number: string;
  name?: string;
  capacity: number;
}

export const MAX_QUANTITY = 99;

export const EMPTY_ORDER: TableOrder = { tableNumber: null, lines: [] };

/** Agrega un platillo; si ya está en el pedido, suma una unidad. */
export function addDish(order: TableOrder, dish: Omit<OrderLine, 'quantity'>): TableOrder {
  const existing = order.lines.find((line) => line.dishId === dish.dishId);
  if (existing) return setQuantity(order, dish.dishId, existing.quantity + 1);
  return { ...order, lines: [...order.lines, { ...dish, quantity: 1 }] };
}

/** Cambia la cantidad (1–99); con 0 o menos quita la línea. */
export function setQuantity(order: TableOrder, dishId: number, quantity: number): TableOrder {
  if (quantity <= 0) return removeLine(order, dishId);
  const clamped = Math.min(MAX_QUANTITY, Math.floor(quantity));
  return {
    ...order,
    lines: order.lines.map((line) => (line.dishId === dishId ? { ...line, quantity: clamped } : line)),
  };
}

export function removeLine(order: TableOrder, dishId: number): TableOrder {
  return { ...order, lines: order.lines.filter((line) => line.dishId !== dishId) };
}

export function setTable(order: TableOrder, tableNumber: string): TableOrder {
  return { ...order, tableNumber };
}

export function itemCount(order: TableOrder): number {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Total estimado en pantalla, redondeado a centavos. */
export function estimatedTotal(order: TableOrder): number {
  const cents = order.lines.reduce((sum, line) => sum + Math.round(line.unitPrice * 100) * line.quantity, 0);
  return cents / 100;
}

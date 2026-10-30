export interface OrderLine {
  dishId: number;
  name: string;
  /** Precio mostrado al mesero; el total real lo calcula el servidor. */
  unitPrice: number;
  quantity: number;
  /** Indicación para cocina ("sin cebolla"). */
  notes?: string;
}

export interface TableOrder {
  tableNumber: string | null;
  lines: OrderLine[];
  /** Personas en la mesa; sin definir cuenta como 1. */
  guests?: number;
  /** Nota general para cocina ("alergia a la nuez"). */
  kitchenNote?: string;
}

/** Forma de la mesa en el plano (columna `forma` del API). */
export type TableShape = 'cuadrada' | 'redonda' | 'rectangular' | 'barra';

export interface Table {
  id: number;
  number: string;
  name?: string;
  capacity: number;
  shape?: TableShape;
  /** Nombre del área (Salón, Terraza, Barra…). */
  area?: string;
}

export const MAX_QUANTITY = 99;
export const MAX_GUESTS = 50;
export const MAX_LINE_NOTE = 200;
export const MAX_KITCHEN_NOTE = 500;

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

/** Personas en la mesa, de 1 a 50. */
export function setGuests(order: TableOrder, guests: number): TableOrder {
  return { ...order, guests: Math.min(MAX_GUESTS, Math.max(1, Math.floor(guests) || 1)) };
}

export function setKitchenNote(order: TableOrder, note: string): TableOrder {
  return { ...order, kitchenNote: note.slice(0, MAX_KITCHEN_NOTE) };
}

/** Nota de un platillo; vacía la quita. */
export function setLineNotes(order: TableOrder, dishId: number, notes: string): TableOrder {
  const clean = notes.slice(0, MAX_LINE_NOTE);
  return {
    ...order,
    lines: order.lines.map((line) =>
      line.dishId === dishId ? { ...line, notes: clean || undefined } : line,
    ),
  };
}

export function itemCount(order: TableOrder): number {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** Total estimado en pantalla, redondeado a centavos. */
export function estimatedTotal(order: TableOrder): number {
  const cents = order.lines.reduce((sum, line) => sum + Math.round(line.unitPrice * 100) * line.quantity, 0);
  return cents / 100;
}

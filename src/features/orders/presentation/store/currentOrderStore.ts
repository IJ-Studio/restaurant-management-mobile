import { createStore, type StoreApi } from 'zustand/vanilla';

import {
  addDish,
  EMPTY_ORDER,
  removeLine,
  setGuests,
  setKitchenNote,
  setLineNotes,
  setQuantity,
  setTable,
  type OrderLine,
  type TableOrder,
} from '../../domain/entities/TableOrder';

export interface CurrentOrderState {
  order: TableOrder;
  add: (dish: Omit<OrderLine, 'quantity'>) => void;
  setQuantity: (dishId: number, quantity: number) => void;
  remove: (dishId: number) => void;
  setTable: (tableNumber: string) => void;
  setGuests: (guests: number) => void;
  setKitchenNote: (note: string) => void;
  setLineNotes: (dishId: number, notes: string) => void;
  clear: () => void;
}

export type CurrentOrderStore = StoreApi<CurrentOrderState>;

/** Pedido en curso de la mesa: 100% local hasta que se manda a cocina (Zustand, HU-05). */
export function createCurrentOrderStore(): CurrentOrderStore {
  return createStore<CurrentOrderState>()((set) => ({
    order: EMPTY_ORDER,
    add: (dish) => set(({ order }) => ({ order: addDish(order, dish) })),
    setQuantity: (dishId, quantity) => set(({ order }) => ({ order: setQuantity(order, dishId, quantity) })),
    remove: (dishId) => set(({ order }) => ({ order: removeLine(order, dishId) })),
    setTable: (tableNumber) => set(({ order }) => ({ order: setTable(order, tableNumber) })),
    setGuests: (guests) => set(({ order }) => ({ order: setGuests(order, guests) })),
    setKitchenNote: (note) => set(({ order }) => ({ order: setKitchenNote(order, note) })),
    setLineNotes: (dishId, notes) => set(({ order }) => ({ order: setLineNotes(order, dishId, notes) })),
    clear: () => set({ order: EMPTY_ORDER }),
  }));
}

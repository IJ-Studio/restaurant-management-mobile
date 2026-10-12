import { create } from 'zustand';

import {
  addDish,
  emptyOrder,
  removeDish,
  setQuantity,
  type CurrentOrder,
  type OrderableDish,
} from '../../domain/entities/CurrentOrder';

interface CurrentOrderState {
  /** Pedidos abiertos por mesa: un mesero puede atender varias. */
  orders: Record<string, CurrentOrder>;
  activeTable: string | null;
  openTable: (table: string) => void;
  addDish: (dish: OrderableDish, quantity?: number) => void;
  setQuantity: (dishId: string, quantity: number) => void;
  removeDish: (dishId: string) => void;
  /** Cierra la mesa activa y descarta su pedido. */
  discardActive: () => void;
  reset: () => void;
}

/** Pedido en curso en memoria (Zustand). No se persiste: se pierde al cerrar sesión. */
export const useCurrentOrderStore = create<CurrentOrderState>()((set) => {
  const updateActive = (update: (order: CurrentOrder) => CurrentOrder) =>
    set((state) => {
      if (!state.activeTable) return state;
      const order = state.orders[state.activeTable] ?? emptyOrder(state.activeTable);
      return { orders: { ...state.orders, [state.activeTable]: update(order) } };
    });

  return {
    orders: {},
    activeTable: null,
    openTable: (table) =>
      set((state) => ({
        activeTable: table,
        orders: state.orders[table] ? state.orders : { ...state.orders, [table]: emptyOrder(table) },
      })),
    addDish: (dish, quantity) => updateActive((order) => addDish(order, dish, quantity)),
    setQuantity: (dishId, quantity) => updateActive((order) => setQuantity(order, dishId, quantity)),
    removeDish: (dishId) => updateActive((order) => removeDish(order, dishId)),
    discardActive: () =>
      set((state) => {
        if (!state.activeTable) return state;
        const { [state.activeTable]: _discarded, ...rest } = state.orders;
        return { orders: rest, activeTable: null };
      }),
    reset: () => set({ orders: {}, activeTable: null }),
  };
});

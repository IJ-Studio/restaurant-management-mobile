import { useState } from 'react';

import { itemCount, normalizeTable, orderTotal } from '../../domain/entities/CurrentOrder';
import { useCurrentOrderStore } from '../store/currentOrderStore';

/** ViewModel de la pantalla "Pedido en curso". */
export function useCurrentOrder() {
  const store = useCurrentOrderStore();
  const [tableInput, setTableInput] = useState('');
  const [tableError, setTableError] = useState<string | null>(null);
  const order = store.activeTable ? (store.orders[store.activeTable] ?? null) : null;

  function openTable(input = tableInput) {
    const table = normalizeTable(input);
    if (!table) {
      setTableError('Escribe un número de mesa del 1 al 999.');
      return;
    }
    setTableError(null);
    setTableInput('');
    store.openTable(table);
  }

  return {
    order,
    openTables: Object.keys(store.orders).sort((a, b) => Number(a) - Number(b)),
    tableInput,
    setTableInput,
    tableError,
    openTable,
    increment: (dishId: string, current: number) => store.setQuantity(dishId, current + 1),
    decrement: (dishId: string, current: number) => store.setQuantity(dishId, current - 1),
    remove: store.removeDish,
    discard: store.discardActive,
    total: order ? orderTotal(order) : 0,
    count: order ? itemCount(order) : 0,
  };
}

/** Para el detalle del menú: agregar el platillo a la mesa activa, si hay una. */
export function useAddToOrder() {
  const activeTable = useCurrentOrderStore((state) => state.activeTable);
  const add = useCurrentOrderStore((state) => state.addDish);
  return { activeTable, add };
}

import { cafe, enchiladas } from '../../__fixtures__/orders';
import {
  addDish,
  EMPTY_ORDER,
  estimatedTotal,
  itemCount,
  removeLine,
  setGuests,
  setKitchenNote,
  setLineNotes,
  setQuantity,
  setTable,
} from '../entities/TableOrder';

describe('pedido en curso de la mesa', () => {
  it('agrega platillos y suma unidades si se repiten', () => {
    let order = addDish(EMPTY_ORDER, enchiladas);
    order = addDish(order, cafe);
    order = addDish(order, enchiladas);

    expect(order.lines.map((l) => [l.name, l.quantity])).toEqual([
      ['Enchiladas suizas', 2],
      ['Café de olla', 1],
    ]);
    expect(itemCount(order)).toBe(3);
  });

  it('no modifica el pedido original', () => {
    const order = addDish(EMPTY_ORDER, enchiladas);
    addDish(order, enchiladas);
    expect(order.lines[0].quantity).toBe(1);
  });

  it('cambia cantidades entre 1 y 99 y quita la línea con 0', () => {
    const order = addDish(addDish(EMPTY_ORDER, enchiladas), cafe);

    expect(setQuantity(order, 1, 150).lines[0].quantity).toBe(99);
    expect(setQuantity(order, 1, 2.7).lines[0].quantity).toBe(2);
    expect(setQuantity(order, 1, 0).lines.map((l) => l.dishId)).toEqual([4]);
    expect(removeLine(order, 4).lines.map((l) => l.dishId)).toEqual([1]);
  });

  it('calcula el total estimado sin errores de punto flotante', () => {
    let order = addDish(EMPTY_ORDER, { dishId: 9, name: 'Agua', unitPrice: 0.1 });
    order = setQuantity(order, 9, 3);
    expect(estimatedTotal(order)).toBe(0.3);

    const full = setQuantity(addDish(addDish(EMPTY_ORDER, enchiladas), cafe), 1, 2);
    expect(estimatedTotal(full)).toBe(336);
  });

  it('asigna la mesa', () => {
    expect(setTable(EMPTY_ORDER, '7').tableNumber).toBe('7');
  });
});

describe('comensales y notas', () => {
  it('los comensales quedan entre 1 y 50', () => {
    expect(setGuests(EMPTY_ORDER, 4).guests).toBe(4);
    expect(setGuests(EMPTY_ORDER, 0).guests).toBe(1);
    expect(setGuests(EMPTY_ORDER, 80).guests).toBe(50);
    expect(setGuests(EMPTY_ORDER, Number.NaN).guests).toBe(1);
  });

  it('las notas tienen tope y una vacía se quita', () => {
    const order = addDish(EMPTY_ORDER, enchiladas);
    expect(setLineNotes(order, 1, 'sin cebolla').lines[0].notes).toBe('sin cebolla');
    expect(setLineNotes(order, 1, '').lines[0].notes).toBeUndefined();
    expect(setLineNotes(order, 1, 'x'.repeat(300)).lines[0].notes).toHaveLength(200);
    expect(setLineNotes(order, 99, 'otra').lines[0].notes).toBeUndefined();
    expect(setKitchenNote(EMPTY_ORDER, 'y'.repeat(600)).kitchenNote).toHaveLength(500);
  });
});

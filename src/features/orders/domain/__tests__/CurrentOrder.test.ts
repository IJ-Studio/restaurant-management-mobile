import {
  addDish,
  emptyOrder,
  itemCount,
  MAX_QUANTITY,
  normalizeTable,
  orderTotal,
  removeDish,
  setQuantity,
  type OrderableDish,
} from '../entities/CurrentOrder';

const tacos: OrderableDish = { id: '1', name: 'Tacos', price: 89.5, available: true };
const agua: OrderableDish = { id: '2', name: 'Agua de jamaica', price: 35.1, available: true };
const agotado: OrderableDish = { id: '3', name: 'Ceviche', price: 145, available: false };

describe('pedido en curso', () => {
  it('agrega platillos y junta los repetidos', () => {
    let order = addDish(emptyOrder('4'), tacos);
    order = addDish(order, agua, 2);
    order = addDish(order, tacos);
    expect(order.lines).toEqual([
      { dishId: '1', name: 'Tacos', unitPrice: 89.5, quantity: 2 },
      { dishId: '2', name: 'Agua de jamaica', unitPrice: 35.1, quantity: 2 },
    ]);
    expect(itemCount(order)).toBe(4);
  });

  it('no agrega platillos agotados ni cantidades inválidas', () => {
    const order = emptyOrder('4');
    expect(addDish(order, agotado)).toBe(order);
    expect(addDish(order, tacos, 0)).toBe(order);
  });

  it('edita la cantidad y quita el platillo al llegar a 0', () => {
    let order = addDish(emptyOrder('4'), tacos, 3);
    order = setQuantity(order, '1', 1);
    expect(order.lines[0].quantity).toBe(1);
    order = setQuantity(order, '1', 0);
    expect(order.lines).toEqual([]);
  });

  it('limita la cantidad a 99 y la redondea', () => {
    const order = addDish(emptyOrder('4'), tacos);
    expect(setQuantity(order, '1', 500).lines[0].quantity).toBe(MAX_QUANTITY);
    expect(setQuantity(order, '1', 2.7).lines[0].quantity).toBe(2);
    expect(addDish(order, tacos, 200).lines[0].quantity).toBe(MAX_QUANTITY);
  });

  it('quita un platillo', () => {
    const order = addDish(addDish(emptyOrder('4'), tacos), agua);
    expect(removeDish(order, '1').lines.map((l) => l.dishId)).toEqual(['2']);
  });

  it('calcula el total en centavos, sin errores de punto flotante', () => {
    const order = addDish(addDish(emptyOrder('4'), agua, 3), tacos);
    expect(orderTotal(order)).toBe(194.8);
    expect(orderTotal(emptyOrder('1'))).toBe(0);
  });

  it('no modifica el pedido original (inmutable)', () => {
    const order = addDish(emptyOrder('4'), tacos);
    addDish(order, agua);
    setQuantity(order, '1', 5);
    expect(order.lines).toEqual([{ dishId: '1', name: 'Tacos', unitPrice: 89.5, quantity: 1 }]);
  });
});

describe('normalizeTable', () => {
  it.each([
    ['4', '4'],
    [' 012 ', '12'],
    ['999', '999'],
  ])('acepta %p', (input, expected) => expect(normalizeTable(input)).toBe(expected));

  it.each(['', '0', '1000', 'A1', '-3', '2.5'])('rechaza %p', (input) => expect(normalizeTable(input)).toBeNull());
});

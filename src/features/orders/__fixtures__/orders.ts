import type { OrderLine, Table, TableOrder } from '../domain/entities/TableOrder';
import type { OrderRepository } from '../domain/repositories/OrderRepository';

export const enchiladas: Omit<OrderLine, 'quantity'> = {
  dishId: 1,
  name: 'Enchiladas suizas',
  unitPrice: 145.5,
};
export const cafe: Omit<OrderLine, 'quantity'> = { dishId: 4, name: 'Café de olla', unitPrice: 45 };

export function makeOrder(overrides: Partial<TableOrder> = {}): TableOrder {
  return {
    tableNumber: '5',
    lines: [
      { ...enchiladas, quantity: 2 },
      { ...cafe, quantity: 1 },
    ],
    ...overrides,
  };
}

export function makeTables(): Table[] {
  return [
    { id: 10, number: '10', capacity: 6 },
    { id: 2, number: '2', capacity: 4, name: 'Terraza' },
    { id: 5, number: '5', capacity: 2 },
  ];
}

export function makeOrderRepository(): jest.Mocked<OrderRepository> {
  return {
    listTables: jest.fn().mockResolvedValue(makeTables()),
    createTableOrder: jest.fn().mockResolvedValue('orden-uuid'),
    confirm: jest
      .fn()
      .mockResolvedValue({ orderId: 'orden-uuid', message: 'Tu pedido fue enviado a cocina.' }),
  };
}

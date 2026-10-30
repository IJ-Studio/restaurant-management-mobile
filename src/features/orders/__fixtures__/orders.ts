import type { ActiveOrder, OrderDetail } from '../domain/entities/ActiveOrder';
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

export function makeActiveOrder(overrides: Partial<ActiveOrder> = {}): ActiveOrder {
  return {
    id: 'orden-uuid',
    customer: 'Ana López',
    time: '08:25 p.m.',
    firstItem: 'Enchiladas suizas',
    place: 'Mesa 5',
    tableNumber: '5',
    status: 'abierta',
    total: 336,
    ...overrides,
  };
}

export function makeOrderDetail(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    id: 'orden-uuid',
    tableNumber: '5',
    status: 'pendiente',
    total: 336,
    openedAt: '2026-10-20T18:00:00.000Z',
    items: [
      { id: 101, name: 'Enchiladas suizas', quantity: 2, unitPrice: 145.5 },
      { id: 102, name: 'Café de olla', quantity: 1, unitPrice: 45 },
    ],
    ...overrides,
  };
}

export function makeOrderRepository(): jest.Mocked<OrderRepository> {
  return {
    listTables: jest.fn().mockResolvedValue(makeTables()),
    createTableOrder: jest.fn().mockResolvedValue('orden-uuid'),
    confirm: jest
      .fn()
      .mockResolvedValue({ orderId: 'orden-uuid', message: 'Tu pedido fue enviado a cocina.' }),
    listActive: jest.fn().mockResolvedValue([makeActiveOrder()]),
    getDetail: jest.fn().mockResolvedValue(makeOrderDetail()),
    cancel: jest.fn().mockResolvedValue('Tu comanda ha sido cancelada con éxito.'),
    removeItem: jest.fn().mockResolvedValue('Producto eliminado de tu pedido.'),
  };
}

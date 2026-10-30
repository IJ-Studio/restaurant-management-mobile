import { makeOrderDetail } from '../../__fixtures__/orders';
import {
  availableActions,
  CANCEL_WINDOW_MS,
  canManageOrders,
  tableNumberFromPlace,
} from '../entities/ActiveOrder';

const OPENED = new Date('2026-10-20T18:00:00.000Z');
const after = (ms: number) => new Date(OPENED.getTime() + ms);

describe('canManageOrders', () => {
  it.each([
    ['admin', true],
    ['cajero', true],
    ['mesero', true],
    ['cocina', false],
    ['cliente', false],
    [undefined, false],
  ] as const)('%s → %s', (role, expected) => {
    expect(canManageOrders(role)).toBe(expected);
  });
});

describe('availableActions', () => {
  it('un pedido pendiente se puede mandar a cocina y quitarle platillos', () => {
    expect(availableActions('mesero', makeOrderDetail({ status: 'pendiente' }), OPENED)).toEqual([
      'confirm',
      'remove-item',
    ]);
  });

  it('un pedido pendiente sin platillos no se puede mandar a cocina', () => {
    expect(availableActions('mesero', makeOrderDetail({ status: 'pendiente', items: [] }), OPENED)).toEqual([
      'remove-item',
    ]);
  });

  it('un pedido en cocina se puede cancelar solo en sus primeros 2 minutos', () => {
    const order = makeOrderDetail({ status: 'abierta', openedAt: OPENED.toISOString() });

    expect(availableActions('admin', order, after(CANCEL_WINDOW_MS))).toEqual(['cancel']);
    expect(availableActions('admin', order, after(CANCEL_WINDOW_MS + 1))).toEqual([]);
    expect(availableActions('admin', order, after(-1000))).toEqual([]);
  });

  it('sin hora de apertura no se ofrece cancelar', () => {
    expect(
      availableActions('cajero', makeOrderDetail({ status: 'abierta', openedAt: undefined }), OPENED),
    ).toEqual([]);
  });

  it('cocina solo consulta; un pedido pagado no tiene acciones', () => {
    expect(availableActions('cocina', makeOrderDetail({ status: 'pendiente' }), OPENED)).toEqual([]);
    expect(availableActions('admin', makeOrderDetail({ status: 'pagada' }), OPENED)).toEqual([]);
  });
});

describe('tableNumberFromPlace', () => {
  it('toma el número de "Mesa B01"; domicilio no tiene mesa', () => {
    expect(tableNumberFromPlace('Mesa B01')).toBe('B01');
    expect(tableNumberFromPlace(' mesa 5 ')).toBe('5');
    expect(tableNumberFromPlace('Domicilio')).toBeUndefined();
  });
});

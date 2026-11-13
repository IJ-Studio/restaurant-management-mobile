import { parseOrderEvent, statusAfter } from '../entities/OrderEvent';

describe('OrderEvent', () => {
  it('lee un evento del flujo con su estatus', () => {
    expect(parseOrderEvent({ change: 'status', orderId: 'o-1', estatus: 'lista', at: 'x' })).toEqual({
      change: 'status',
      orderId: 'o-1',
      status: 'lista',
    });
  });

  it('ignora un estatus desconocido pero conserva el evento', () => {
    expect(parseOrderEvent({ change: 'status', orderId: 'o-1', estatus: 'volando' })).toEqual({
      change: 'status',
      orderId: 'o-1',
    });
  });

  it.each([
    ['sin cuerpo', null],
    ['cambio desconocido', { change: 'borrado', orderId: 'o-1' }],
    ['sin pedido', { change: 'sent' }],
    ['id vacío', { change: 'sent', orderId: '' }],
    ['texto', 'hola'],
  ])('%s → se descarta', (_caso, raw) => {
    expect(parseOrderEvent(raw)).toBeNull();
  });

  it.each([
    [{ change: 'status', orderId: 'o', status: 'lista' }, 'lista'],
    [{ change: 'sent', orderId: 'o' }, 'abierta'],
    [{ change: 'cancelled', orderId: 'o' }, 'cancelada'],
    [{ change: 'items', orderId: 'o' }, null],
    [{ change: 'charged', orderId: 'o' }, null],
    [{ change: 'status', orderId: 'o' }, null],
  ] as const)('%o deja el pedido en %s', (event, expected) => {
    expect(statusAfter(event)).toBe(expected);
  });
});

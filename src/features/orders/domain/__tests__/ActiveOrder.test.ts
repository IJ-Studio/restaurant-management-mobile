import { makeOrderDetail } from '../../__fixtures__/orders';
import {
  availableActions,
  CANCEL_WINDOW_MS,
  canCharge,
  canOpenOrder,
  isKitchen,
  minutesOpen,
  quickAction,
  tableNumberFromPlace,
} from '../entities/ActiveOrder';

const OPENED = new Date('2026-10-20T18:00:00.000Z');
const after = (ms: number) => new Date(OPENED.getTime() + ms);
const detail = (status: string, overrides = {}) =>
  makeOrderDetail({ status, openedAt: OPENED.toISOString(), ...overrides });

describe('permisos por rol', () => {
  it.each([
    ['admin', true, true, false],
    ['cajero', true, true, false],
    ['mesero', true, false, false],
    ['cocina', true, false, true],
    ['cliente', false, false, false],
    [undefined, false, false, false],
  ] as const)('%s: abrir %s · cobrar %s · cocina %s', (role, open, charge, kitchen) => {
    expect(canOpenOrder(role)).toBe(open);
    expect(canCharge(role)).toBe(charge);
    expect(isKitchen(role)).toBe(kitchen);
  });
});

describe('availableActions', () => {
  it('piso: un pedido pendiente se manda a cocina y se le quitan platillos', () => {
    expect(availableActions('mesero', detail('pendiente'), OPENED)).toEqual(['confirm', 'remove-item']);
    expect(availableActions('mesero', detail('pendiente', { items: [] }), OPENED)).toEqual(['remove-item']);
  });

  it('piso: un pedido en cocina se cancela solo en sus primeros 2 minutos', () => {
    expect(availableActions('mesero', detail('abierta'), after(CANCEL_WINDOW_MS))).toEqual(['cancel']);
    expect(availableActions('mesero', detail('abierta'), after(CANCEL_WINDOW_MS + 1))).toEqual([]);
    expect(availableActions('mesero', detail('abierta'), after(-1000))).toEqual([]);
    expect(availableActions('mesero', detail('abierta', { openedAt: undefined }), OPENED)).toEqual([]);
  });

  it('piso entrega lo que cocina dejó listo', () => {
    expect(availableActions('mesero', detail('lista'), OPENED)).toEqual(['deliver']);
  });

  it('cocina empieza y termina; no cancela, no entrega, no cobra', () => {
    expect(availableActions('cocina', detail('abierta'), OPENED)).toEqual(['start', 'ready']);
    expect(availableActions('cocina', detail('en_preparacion'), OPENED)).toEqual(['ready']);
    expect(availableActions('cocina', detail('lista'), OPENED)).toEqual([]);
    expect(availableActions('cocina', detail('pendiente'), OPENED)).toEqual([]);
  });

  it('caja cobra cualquier pedido que ya está en el restaurante', () => {
    expect(availableActions('cajero', detail('entregada'), after(CANCEL_WINDOW_MS + 1))).toEqual(['charge']);
    expect(availableActions('cajero', detail('en_preparacion'), OPENED)).toEqual(['charge']);
    expect(availableActions('cajero', detail('pendiente'), OPENED)).toEqual(['confirm', 'remove-item']);
    expect(availableActions('cajero', detail('pagada'), OPENED)).toEqual([]);
  });

  it('el administrador puede hacer cualquier paso', () => {
    expect(availableActions('admin', detail('abierta'), OPENED)).toEqual([
      'cancel',
      'start',
      'ready',
      'charge',
    ]);
  });
});

describe('quickAction', () => {
  it('ofrece el siguiente paso en la tarjeta según el rol', () => {
    expect(quickAction('cocina', { status: 'abierta' })).toBe('start');
    expect(quickAction('cocina', { status: 'en_preparacion' })).toBe('ready');
    expect(quickAction('mesero', { status: 'lista' })).toBe('deliver');
    expect(quickAction('mesero', { status: 'abierta' })).toBeUndefined();
    expect(quickAction('cocina', { status: 'lista' })).toBeUndefined();
  });
});

describe('minutesOpen', () => {
  it('cuenta los minutos completos desde que se abrió', () => {
    expect(minutesOpen(OPENED.toISOString(), after(12.5 * 60000))).toBe(12);
    expect(minutesOpen(OPENED.toISOString(), after(-60000))).toBe(0);
    expect(minutesOpen(undefined, OPENED)).toBeUndefined();
    expect(minutesOpen('no es fecha', OPENED)).toBeUndefined();
  });
});

describe('tableNumberFromPlace', () => {
  it('toma el número de "Mesa B01"; domicilio no tiene mesa', () => {
    expect(tableNumberFromPlace('Mesa B01')).toBe('B01');
    expect(tableNumberFromPlace(' mesa 5 ')).toBe('5');
    expect(tableNumberFromPlace('Domicilio')).toBeUndefined();
  });
});

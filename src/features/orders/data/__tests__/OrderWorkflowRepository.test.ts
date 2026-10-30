import { AppError } from '../../../../core/errors/AppError';
import type { HttpClient } from '../../../../core/http/httpClient';
import { OrderRemoteDataSource } from '../datasources/OrderRemoteDataSource';
import { OrderRepositoryImpl } from '../repositories/OrderRepositoryImpl';

type Verb = 'get' | 'post' | 'patch' | 'delete';

function setup(http: Partial<Record<Verb, jest.Mock>>) {
  return new OrderRepositoryImpl(new OrderRemoteDataSource(http as unknown as HttpClient));
}

const reject = (error: unknown) => jest.fn().mockRejectedValue(error);
const forbidden = () => reject(new AppError('forbidden', 'Forbidden resource', 403));

describe('OrderRepositoryImpl: pedidos activos', () => {
  it('mapea GET /pedidos/admin/recent con sus platillos y la hora en ISO', async () => {
    const get = jest.fn().mockResolvedValue([
      {
        id: 'cfb8',
        customer: 'administrador test',
        time: '08:25 p.m.',
        item: 'Piña Colada',
        table: 'Mesa B01',
        status: 'en_preparacion',
        total: 75,
        openedAt: '2026-10-29T02:25:22.595Z',
        items: [
          { nombre: 'Piña Colada', cantidad: 2 },
          { nombre: null, cantidad: 1 },
          { nombre: 'Agua', cantidad: null },
        ],
      },
      {
        id: 'dom1',
        customer: ' ',
        time: null,
        item: null,
        table: 'Domicilio',
        status: null,
        total: '120.50',
      },
      {
        id: 'na1',
        customer: null,
        time: '09:00 p.m.',
        item: null,
        table: 'N/A',
        status: 'pendiente',
        total: 'x',
      },
    ]);

    await expect(setup({ get }).listActive()).resolves.toEqual([
      {
        id: 'cfb8',
        customer: 'administrador test',
        time: '08:25 p.m.',
        openedAt: '2026-10-29T02:25:22.595Z',
        firstItem: 'Piña Colada',
        items: [
          { name: 'Piña Colada', quantity: 2 },
          { name: 'Agua', quantity: 1 },
        ],
        place: 'Mesa B01',
        tableNumber: 'B01',
        status: 'en_preparacion',
        total: 75,
      },
      {
        id: 'dom1',
        customer: 'Sin cliente',
        time: '—',
        openedAt: undefined,
        firstItem: '—',
        items: [],
        place: 'Domicilio',
        tableNumber: undefined,
        status: 'abierta',
        total: 120.5,
      },
      {
        id: 'na1',
        customer: 'Sin cliente',
        time: '09:00 p.m.',
        openedAt: undefined,
        firstItem: '—',
        items: [],
        place: 'Sin mesa',
        tableNumber: undefined,
        status: 'pendiente',
        total: 0,
      },
    ]);
    expect(get).toHaveBeenCalledWith('pedidos/admin/recent');
  });

  it('explica un 403 y deja pasar otros errores', async () => {
    await expect(setup({ get: forbidden() }).listActive()).rejects.toThrow(
      'Tu rol no tiene permiso para ver los pedidos.',
    );
    const offline = new AppError('network', 'No hay conexión con el servidor.');
    await expect(setup({ get: reject(offline) }).listActive()).rejects.toBe(offline);
    const plain = new Error('boom');
    await expect(setup({ get: reject(plain) }).listActive()).rejects.toBe(plain);
  });
});

describe('OrderRepositoryImpl: detalle', () => {
  it('trae GET /pedidos/:id y convierte fechas, montos, notas e imágenes', async () => {
    const get = jest.fn().mockResolvedValue({
      id: '66ff',
      tipo: 'mesa',
      mesa: 'S01',
      estatus: 'abierta',
      subtotal: '215.00',
      propina: '20.00',
      total: '215.00',
      notasCocina: '  Alergia a la nuez ',
      tiempoApertura: '2026-10-15 20:41:35.626+00',
      items: [
        {
          id: 10786,
          cantidad: 1,
          precioUnitario: '75.00',
          notas: ' sin hielo ',
          platillo: { nombre: 'Piña Colada', imagenUrl: null },
        },
        {
          id: 10787,
          cantidad: 2,
          precioUnitario: '70.00',
          notas: null,
          platillo: { nombre: null, imagenUrl: 'https://cdn.quijote.mx/ojos.jpg' },
        },
        {
          id: 10788,
          cantidad: 1,
          precioUnitario: '0',
          notas: '',
          platillo: { nombre: 'Agua', imagenUrl: 'http://inseguro.mx/agua.jpg' },
        },
      ],
    });

    await expect(setup({ get }).getDetail('66ff')).resolves.toEqual({
      id: '66ff',
      tableNumber: 'S01',
      status: 'abierta',
      total: 215,
      tip: 20,
      openedAt: '2026-10-15T20:41:35.626+00:00',
      kitchenNotes: 'Alergia a la nuez',
      items: [
        {
          id: 10786,
          name: 'Piña Colada',
          quantity: 1,
          unitPrice: 75,
          notes: 'sin hielo',
          imageUrl: undefined,
        },
        {
          id: 10787,
          name: 'Platillo',
          quantity: 2,
          unitPrice: 70,
          notes: undefined,
          imageUrl: 'https://cdn.quijote.mx/ojos.jpg',
        },
        { id: 10788, name: 'Agua', quantity: 1, unitPrice: 0, notes: undefined, imageUrl: undefined },
      ],
    });
    expect(get).toHaveBeenCalledWith('pedidos/66ff');
  });

  it('un pedido a domicilio no tiene mesa; los vacíos usan valores seguros', async () => {
    const get = jest.fn().mockResolvedValue({
      id: 'd1',
      tipo: 'domicilio',
      mesa: null,
      estatus: null,
      subtotal: null,
      propina: null,
      total: null,
      notasCocina: null,
      tiempoApertura: null,
      items: [],
    });
    await expect(setup({ get }).getDetail('d1')).resolves.toMatchObject({
      tableNumber: undefined,
      status: 'abierta',
      total: 0,
      tip: 0,
      openedAt: undefined,
      kitchenNotes: undefined,
    });
  });

  it('explica cuando el pedido ya no existe o el rol no puede verlo', async () => {
    await expect(
      setup({ get: reject(new AppError('not-found', 'El pedido no existe.', 404)) }).getDetail('x'),
    ).rejects.toMatchObject({ kind: 'not-found', message: 'Este pedido ya no está disponible.' });
    await expect(setup({ get: forbidden() }).getDetail('x')).rejects.toThrow(
      'Tu rol no tiene permiso para ver este pedido.',
    );
  });
});

describe('OrderRepositoryImpl: estatus y cobro', () => {
  it('avanza el estatus y pide refrescar si otro dispositivo se adelantó (409)', async () => {
    const patch = jest
      .fn()
      .mockResolvedValue({ success: true, message: 'Cocina empezó a preparar el pedido.' });
    await expect(setup({ patch }).updateStatus('66ff', 'en_preparacion')).resolves.toBe(
      'Cocina empezó a preparar el pedido.',
    );
    expect(patch).toHaveBeenCalledWith('pedidos/66ff/estatus', { estatus: 'en_preparacion' });

    await expect(
      setup({ patch: jest.fn().mockResolvedValue({ success: true }) }).updateStatus('66ff', 'lista'),
    ).resolves.toBe('Pedido actualizado.');

    const conflict = reject(new AppError('unknown', 'El pedido cambió mientras tanto.', 409));
    await expect(setup({ patch: conflict }).updateStatus('66ff', 'lista')).rejects.toMatchObject({
      kind: 'validation',
      message: 'El pedido cambió mientras tanto. Desliza hacia abajo para actualizar.',
    });
    await expect(setup({ patch: forbidden() }).updateStatus('66ff', 'lista')).rejects.toThrow(
      'Tu rol no puede hacer este cambio en el pedido.',
    );
  });

  it('lista los métodos de pago de caja', async () => {
    const get = jest.fn().mockResolvedValue([
      { id: 1, nombre: 'Efectivo', tipo: 'efectivo', aplicaPropina: true, esEfectivo: true },
      { id: 2, nombre: 'Tarjeta débito', tipo: 'tarjeta', aplicaPropina: true, esEfectivo: false },
      { id: 4, nombre: 'Transferencia', tipo: 'digital', aplicaPropina: false, esEfectivo: false },
      { id: 9, nombre: 'Vales', tipo: null, aplicaPropina: true, esEfectivo: false },
    ]);
    await expect(setup({ get }).listPaymentMethods()).resolves.toEqual([
      { id: 1, name: 'Efectivo', kind: 'cash', allowsTip: true },
      { id: 2, name: 'Tarjeta débito', kind: 'card', allowsTip: true },
      { id: 4, name: 'Transferencia', kind: 'digital', allowsTip: false },
      { id: 9, name: 'Vales', kind: 'other', allowsTip: true },
    ]);
    expect(get).toHaveBeenCalledWith('pedidos/metodos-pago');
    await expect(setup({ get: forbidden() }).listPaymentMethods()).rejects.toThrow(
      'Solo caja puede cobrar pedidos.',
    );
  });

  it('cobra sin mandar el monto del pedido y devuelve el comprobante', async () => {
    const post = jest.fn().mockResolvedValue({
      success: true,
      message: '',
      metodo: 'Efectivo',
      total: '215.00',
      propina: '20.00',
      totalCobrado: '235.00',
      cambio: '65.00',
    });

    await expect(
      setup({ post }).charge('66ff', { methodId: 1, tip: 20, received: 300, reference: '  ' }),
    ).resolves.toEqual({
      message: 'Pago registrado.',
      method: 'Efectivo',
      total: 215,
      tip: 20,
      charged: 235,
      change: 65,
    });
    expect(post).toHaveBeenCalledWith('pedidos/66ff/cobrar', {
      metodoPagoId: 1,
      propina: 20,
      montoRecibido: 300,
      referencia: undefined,
    });

    await setup({ post }).charge('66ff', { methodId: 2, tip: 0, reference: ' A-1 ' });
    expect(post).toHaveBeenLastCalledWith('pedidos/66ff/cobrar', {
      metodoPagoId: 2,
      propina: undefined,
      montoRecibido: undefined,
      referencia: 'A-1',
    });

    const paid = reject(new AppError('unknown', 'Este pedido ya está pagado.', 409));
    await expect(setup({ post: paid }).charge('66ff', { methodId: 1, tip: 0 })).rejects.toThrow(
      'Este pedido ya está pagado. Desliza hacia abajo para actualizar.',
    );
    await expect(setup({ post: forbidden() }).charge('66ff', { methodId: 1, tip: 0 })).rejects.toThrow(
      'Solo caja puede cobrar pedidos.',
    );
  });
});

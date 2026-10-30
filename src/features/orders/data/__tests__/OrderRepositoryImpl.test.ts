import { AppError } from '../../../../core/errors/AppError';
import type { HttpClient } from '../../../../core/http/httpClient';
import { makeOrder } from '../../__fixtures__/orders';
import { OrderRemoteDataSource } from '../datasources/OrderRemoteDataSource';
import { OrderRepositoryImpl } from '../repositories/OrderRepositoryImpl';

function setup(http: Partial<Record<'get' | 'post' | 'patch' | 'delete', jest.Mock>>) {
  return new OrderRepositoryImpl(new OrderRemoteDataSource(http as unknown as HttpClient));
}

describe('OrderRepositoryImpl', () => {
  it('lista solo las mesas activas', async () => {
    const get = jest.fn().mockResolvedValue([
      { id: 1, numero: '1', nombre: 'Ventana', capacidad: 4, activa: true, qrCodeUrl: 'x' },
      { id: 2, numero: '2', nombre: null, capacidad: 2, activa: false },
      { id: 3, numero: '3', nombre: null, capacidad: 6, activa: null },
    ]);

    await expect(setup({ get }).listTables()).resolves.toEqual([
      { id: 1, number: '1', name: 'Ventana', capacity: 4 },
      { id: 3, number: '3', name: undefined, capacity: 6 },
    ]);
    expect(get).toHaveBeenCalledWith('mesas');
  });

  it('registra la orden de la mesa sin mandar precios', async () => {
    const post = jest
      .fn()
      .mockResolvedValue({ success: true, message: 'ok', ordenId: 'uuid-9', total: '336.00' });

    await expect(setup({ post }).createTableOrder(7, '5', makeOrder().lines)).resolves.toBe('uuid-9');
    expect(post).toHaveBeenCalledWith('pedidos/mesa', {
      usuarioId: 7,
      mesa: '5',
      items: [
        { platilloId: 1, cantidad: 2 },
        { platilloId: 4, cantidad: 1 },
      ],
    });
  });

  it('falla si el servidor no devuelve el id de la orden', async () => {
    const post = jest.fn().mockResolvedValue({ success: true, message: 'ok' });
    await expect(setup({ post }).createTableOrder(7, '5', makeOrder().lines)).rejects.toThrow(
      'número de orden',
    );
  });

  it('confirma la orden y devuelve el mensaje del API', async () => {
    const post = jest
      .fn()
      .mockResolvedValue({ success: true, message: 'Tu pedido fue enviado a cocina.', ordenId: 'uuid-9' });

    await expect(setup({ post }).confirm('uuid-9')).resolves.toEqual({
      orderId: 'uuid-9',
      message: 'Tu pedido fue enviado a cocina.',
    });
    expect(post).toHaveBeenCalledWith('pedidos/confirmar/uuid-9');
  });

  it('usa valores por defecto si la confirmación viene incompleta', async () => {
    const post = jest.fn().mockResolvedValue({ success: true });
    await expect(setup({ post }).confirm('uuid-9')).resolves.toEqual({
      orderId: 'uuid-9',
      message: 'Pedido enviado a cocina.',
    });
  });

  it('lista los pedidos activos del día con el formato de GET /pedidos/admin/recent', async () => {
    const get = jest.fn().mockResolvedValue([
      {
        id: 'cfb8',
        customer: 'administrador test',
        time: '08:25 p.m.',
        item: 'Piña Colada',
        table: 'Mesa B01',
        status: 'abierta',
        total: 75,
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
        item: 'Café',
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
        firstItem: 'Piña Colada',
        place: 'Mesa B01',
        tableNumber: 'B01',
        status: 'abierta',
        total: 75,
      },
      {
        id: 'dom1',
        customer: 'Sin cliente',
        time: '—',
        firstItem: '—',
        place: 'Domicilio',
        tableNumber: undefined,
        status: 'abierta',
        total: 120.5,
      },
      {
        id: 'na1',
        customer: 'Sin cliente',
        time: '09:00 p.m.',
        firstItem: 'Café',
        place: 'Sin mesa',
        tableNumber: undefined,
        status: 'pendiente',
        total: 0,
      },
    ]);
    expect(get).toHaveBeenCalledWith('pedidos/admin/recent');
  });

  it('explica un 403 al listar pedidos y deja pasar otros errores', async () => {
    const forbidden = jest.fn().mockRejectedValue(new AppError('forbidden', 'Forbidden resource', 403));
    await expect(setup({ get: forbidden }).listActive()).rejects.toThrow(
      'Tu rol no tiene permiso para ver los pedidos.',
    );

    const offline = new AppError('network', 'No hay conexión con el servidor.');
    await expect(setup({ get: jest.fn().mockRejectedValue(offline) }).listActive()).rejects.toBe(offline);
  });

  it('toma el detalle del pedido entre los de su mesa y convierte fechas y montos', async () => {
    const get = jest.fn().mockResolvedValue([
      { id: 'otra', mesaId: 'S01', estatus: 'pagada', total: '10.00', tiempoApertura: null, ordenItems: [] },
      {
        id: '66ff',
        mesaId: 'S01',
        estatus: 'abierta',
        total: '215.00',
        tiempoApertura: '2026-10-15 20:41:35.626+00',
        ordenItems: [
          {
            id: 10786,
            cantidad: 1,
            precioUnitario: '75.00',
            platillo: { nombre: 'Piña Colada', imagenUrl: null },
          },
          {
            id: 10787,
            cantidad: 2,
            precioUnitario: '70.00',
            platillo: { nombre: null, imagenUrl: 'https://cdn.quijote.mx/ojos.jpg' },
          },
          {
            id: 10788,
            cantidad: 1,
            precioUnitario: '0',
            platillo: { nombre: 'Agua', imagenUrl: 'http://inseguro.mx/agua.jpg' },
          },
        ],
      },
    ]);

    await expect(setup({ get }).getDetail('S01', '66ff')).resolves.toEqual({
      id: '66ff',
      tableNumber: 'S01',
      status: 'abierta',
      total: 215,
      openedAt: '2026-10-15T20:41:35.626+00:00',
      items: [
        { id: 10786, name: 'Piña Colada', quantity: 1, unitPrice: 75, imageUrl: undefined },
        {
          id: 10787,
          name: 'Platillo',
          quantity: 2,
          unitPrice: 70,
          imageUrl: 'https://cdn.quijote.mx/ojos.jpg',
        },
        { id: 10788, name: 'Agua', quantity: 1, unitPrice: 0, imageUrl: undefined },
      ],
    });
    expect(get).toHaveBeenCalledWith('pedidos/usuario?mesaId=S01');
  });

  it('si el pedido ya no está en la mesa avisa con un mensaje claro', async () => {
    const get = jest.fn().mockResolvedValue([]);
    await expect(setup({ get }).getDetail('S 01', 'x')).rejects.toMatchObject({
      kind: 'not-found',
      message: 'Este pedido ya no está disponible.',
    });
    expect(get).toHaveBeenCalledWith('pedidos/usuario?mesaId=S%2001');
  });

  it('cancela y quita platillos con los endpoints del API', async () => {
    const patch = jest
      .fn()
      .mockResolvedValue({ success: true, message: 'Tu comanda ha sido cancelada con éxito.' });
    const del = jest.fn().mockResolvedValue({ success: true, message: 'Producto eliminado de tu pedido.' });
    const repository = setup({ patch, delete: del });

    await expect(repository.cancel('66ff')).resolves.toBe('Tu comanda ha sido cancelada con éxito.');
    await expect(repository.removeItem(10786)).resolves.toBe('Producto eliminado de tu pedido.');
    expect(patch).toHaveBeenCalledWith('pedidos/cancelar/66ff');
    expect(del).toHaveBeenCalledWith('pedidos/item/10786');
  });

  it('usa mensajes por defecto si el API no los manda', async () => {
    const repository = setup({
      patch: jest.fn().mockResolvedValue({ success: true }),
      delete: jest.fn().mockResolvedValue({ success: true }),
    });
    await expect(repository.cancel('66ff')).resolves.toBe('Pedido cancelado.');
    await expect(repository.removeItem(1)).resolves.toBe('Platillo quitado del pedido.');
  });
});

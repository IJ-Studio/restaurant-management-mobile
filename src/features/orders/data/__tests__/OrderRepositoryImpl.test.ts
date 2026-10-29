import type { HttpClient } from '../../../../core/http/httpClient';
import { makeOrder } from '../../__fixtures__/orders';
import { OrderRemoteDataSource } from '../datasources/OrderRemoteDataSource';
import { OrderRepositoryImpl } from '../repositories/OrderRepositoryImpl';

function setup(http: Partial<Record<'get' | 'post' | 'patch' | 'delete', jest.Mock>>) {
  return new OrderRepositoryImpl(new OrderRemoteDataSource(http as unknown as HttpClient));
}

describe('OrderRepositoryImpl', () => {
  it('lista solo las mesas activas, con su forma y su área', async () => {
    const get = jest.fn((path: string) =>
      Promise.resolve(
        path === 'mesas'
          ? [
              { id: 1, numero: '1', nombre: 'Ventana', capacidad: 4, activa: true, forma: 'Redonda' },
              { id: 2, numero: '2', nombre: null, capacidad: 2, activa: false },
              { id: 3, numero: '3', nombre: null, capacidad: 6, activa: null, forma: 'triangular' },
            ]
          : [
              { id: 1, areaNombre: 'Terraza' },
              { id: 3, areaNombre: null },
            ],
      ),
    );

    await expect(setup({ get }).listTables()).resolves.toEqual([
      { id: 1, number: '1', name: 'Ventana', capacity: 4, shape: 'redonda', area: 'Terraza' },
      { id: 3, number: '3', name: undefined, capacity: 6, shape: 'cuadrada', area: undefined },
    ]);
    expect(get).toHaveBeenCalledWith('mesas');
    expect(get).toHaveBeenCalledWith('reservations/map');
  });

  it('si no se pueden leer las áreas, las mesas se muestran igual', async () => {
    const get = jest.fn((path: string) =>
      path === 'mesas'
        ? Promise.resolve([{ id: 1, numero: '1', nombre: null, capacidad: 2, activa: true, forma: 'barra' }])
        : Promise.reject(new Error('offline')),
    );
    await expect(setup({ get }).listTables()).resolves.toEqual([
      { id: 1, number: '1', name: undefined, capacity: 2, shape: 'barra', area: undefined },
    ]);
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

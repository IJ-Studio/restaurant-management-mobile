import type { HttpClient } from '../../../../core/http/httpClient';
import { makeOrder } from '../../__fixtures__/orders';
import { OrderRemoteDataSource } from '../datasources/OrderRemoteDataSource';
import { OrderRepositoryImpl } from '../repositories/OrderRepositoryImpl';

function setup(http: Partial<Record<'get' | 'post', jest.Mock>>) {
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
});

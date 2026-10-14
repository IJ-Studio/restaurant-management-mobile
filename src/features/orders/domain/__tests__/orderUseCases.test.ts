import { makeOrder, makeOrderRepository } from '../../__fixtures__/orders';
import { ListTablesUseCase } from '../usecases/ListTablesUseCase';
import { SendOrderToKitchenUseCase } from '../usecases/SendOrderToKitchenUseCase';

describe('SendOrderToKitchenUseCase', () => {
  it('registra la orden en la mesa a nombre del mesero y la manda a cocina', async () => {
    const repository = makeOrderRepository();
    const order = makeOrder();

    await expect(new SendOrderToKitchenUseCase(repository).execute(order, 7)).resolves.toEqual({
      orderId: 'orden-uuid',
      message: 'Tu pedido fue enviado a cocina.',
    });
    expect(repository.createTableOrder).toHaveBeenCalledWith(7, '5', order.lines);
    expect(repository.confirm).toHaveBeenCalledWith('orden-uuid');
  });

  it.each([
    [makeOrder({ tableNumber: null }), 7, 'Elige la mesa.'],
    [makeOrder({ lines: [] }), 7, 'Agrega al menos un platillo.'],
    [makeOrder(), Number.NaN, 'Vuelve a iniciar sesión.'],
  ])('no envía un pedido incompleto (%#)', async (order, waiterId, message) => {
    const repository = makeOrderRepository();

    await expect(new SendOrderToKitchenUseCase(repository).execute(order, waiterId)).rejects.toThrow(message);
    expect(repository.createTableOrder).not.toHaveBeenCalled();
  });

  it('si falla el registro no intenta confirmar', async () => {
    const repository = makeOrderRepository();
    repository.createTableOrder.mockRejectedValue(new Error('mesa inactiva'));

    await expect(new SendOrderToKitchenUseCase(repository).execute(makeOrder(), 7)).rejects.toThrow(
      'mesa inactiva',
    );
    expect(repository.confirm).not.toHaveBeenCalled();
  });
});

describe('ListTablesUseCase', () => {
  it('ordena las mesas por número natural', async () => {
    const tables = await new ListTablesUseCase(makeOrderRepository()).execute();
    expect(tables.map((t) => t.number)).toEqual(['2', '5', '10']);
  });
});

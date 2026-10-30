import { makeActiveOrder, makeOrderDetail, makeOrderRepository } from '../../__fixtures__/orders';
import { CancelOrderUseCase } from '../usecases/CancelOrderUseCase';
import { ConfirmOrderUseCase } from '../usecases/ConfirmOrderUseCase';
import { GetOrderDetailUseCase } from '../usecases/GetOrderDetailUseCase';
import { ListActiveOrdersUseCase } from '../usecases/ListActiveOrdersUseCase';
import { RemoveOrderItemUseCase } from '../usecases/RemoveOrderItemUseCase';

describe('casos de uso de la gestión de pedidos', () => {
  it('ListActiveOrdersUseCase devuelve los pedidos activos del repositorio', async () => {
    const repository = makeOrderRepository();
    await expect(new ListActiveOrdersUseCase(repository).execute()).resolves.toEqual([makeActiveOrder()]);
  });

  it('GetOrderDetailUseCase busca el pedido en su mesa', async () => {
    const repository = makeOrderRepository();
    await expect(new GetOrderDetailUseCase(repository).execute('5', 'orden-uuid')).resolves.toEqual(
      makeOrderDetail(),
    );
    expect(repository.getDetail).toHaveBeenCalledWith('5', 'orden-uuid');
  });

  it('GetOrderDetailUseCase no consulta un pedido sin mesa', async () => {
    const repository = makeOrderRepository();
    await expect(new GetOrderDetailUseCase(repository).execute('', 'orden-uuid')).rejects.toThrow(
      'Este pedido no tiene mesa.',
    );
    expect(repository.getDetail).not.toHaveBeenCalled();
  });

  it('ConfirmOrderUseCase, CancelOrderUseCase y RemoveOrderItemUseCase delegan en el repositorio', async () => {
    const repository = makeOrderRepository();

    await expect(new ConfirmOrderUseCase(repository).execute('orden-uuid')).resolves.toMatchObject({
      orderId: 'orden-uuid',
    });
    await expect(new CancelOrderUseCase(repository).execute('orden-uuid')).resolves.toBe(
      'Tu comanda ha sido cancelada con éxito.',
    );
    await expect(new RemoveOrderItemUseCase(repository).execute(101)).resolves.toBe(
      'Producto eliminado de tu pedido.',
    );
    expect(repository.confirm).toHaveBeenCalledWith('orden-uuid');
    expect(repository.cancel).toHaveBeenCalledWith('orden-uuid');
    expect(repository.removeItem).toHaveBeenCalledWith(101);
  });
});

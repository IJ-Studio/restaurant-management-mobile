import {
  cash,
  debit,
  makeActiveOrder,
  makeOrderDetail,
  makeOrderRepository,
  makeReceipt,
} from '../../__fixtures__/orders';
import { CancelOrderUseCase } from '../usecases/CancelOrderUseCase';
import { ChargeOrderUseCase } from '../usecases/ChargeOrderUseCase';
import { ConfirmOrderUseCase } from '../usecases/ConfirmOrderUseCase';
import { GetOrderDetailUseCase } from '../usecases/GetOrderDetailUseCase';
import { ListActiveOrdersUseCase } from '../usecases/ListActiveOrdersUseCase';
import { ListPaymentMethodsUseCase } from '../usecases/ListPaymentMethodsUseCase';
import { RemoveOrderItemUseCase } from '../usecases/RemoveOrderItemUseCase';
import { UpdateOrderStatusUseCase } from '../usecases/UpdateOrderStatusUseCase';

describe('casos de uso de la gestión de pedidos', () => {
  it('ListActiveOrdersUseCase y GetOrderDetailUseCase consultan el repositorio', async () => {
    const repository = makeOrderRepository();
    await expect(new ListActiveOrdersUseCase(repository).execute()).resolves.toEqual([makeActiveOrder()]);
    await expect(new GetOrderDetailUseCase(repository).execute('orden-uuid')).resolves.toEqual(
      makeOrderDetail(),
    );
    expect(repository.getDetail).toHaveBeenCalledWith('orden-uuid');
  });

  it('confirmar, cancelar, quitar platillo y avanzar el estatus delegan en el repositorio', async () => {
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
    await expect(new UpdateOrderStatusUseCase(repository).execute('orden-uuid', 'lista')).resolves.toBe(
      'Pedido actualizado.',
    );
    expect(repository.updateStatus).toHaveBeenCalledWith('orden-uuid', 'lista');
  });

  it('ListPaymentMethodsUseCase pone primero el efectivo, luego tarjeta y digital', async () => {
    const methods = await new ListPaymentMethodsUseCase(makeOrderRepository()).execute();
    expect(methods.map((m) => m.name)).toEqual(['Efectivo', 'Tarjeta débito', 'Transferencia']);
  });
});

describe('ChargeOrderUseCase', () => {
  const order = { id: 'orden-uuid', remaining: 336 };

  it('cobra en efectivo con propina y lo recibido', async () => {
    const repository = makeOrderRepository();
    await expect(
      new ChargeOrderUseCase(repository).execute(order, cash, { tip: 34, received: 500 }),
    ).resolves.toEqual(makeReceipt());
    expect(repository.charge).toHaveBeenCalledWith('orden-uuid', { methodId: 1, tip: 34, received: 500 });
  });

  it('con tarjeta no manda efectivo; sin propina permitida la quita', async () => {
    const repository = makeOrderRepository();
    await new ChargeOrderUseCase(repository).execute(order, debit, {
      tip: 10,
      received: 999,
      reference: 'A1',
    });
    expect(repository.charge).toHaveBeenLastCalledWith('orden-uuid', {
      methodId: 2,
      tip: 10,
      received: undefined,
      reference: 'A1',
    });

    await new ChargeOrderUseCase(repository).execute(order, { ...debit, allowsTip: false }, { tip: 10 });
    expect(repository.charge).toHaveBeenLastCalledWith('orden-uuid', expect.objectContaining({ tip: 0 }));
  });

  it('un cobro inválido no llega al API', async () => {
    const repository = makeOrderRepository();
    await expect(
      new ChargeOrderUseCase(repository).execute(order, cash, { tip: 0, received: 100 }),
    ).rejects.toMatchObject({ kind: 'validation', message: 'El efectivo no alcanza: faltan $236.00.' });
    await expect(new ChargeOrderUseCase(repository).execute(order, undefined, { tip: 0 })).rejects.toThrow(
      'Elige cómo paga el cliente.',
    );
    expect(repository.charge).not.toHaveBeenCalled();
  });

  it('cuenta separada: cobra una parte con su etiqueta', async () => {
    const repository = makeOrderRepository();
    await new ChargeOrderUseCase(repository).execute(order, debit, {
      tip: 0,
      amount: 100,
      label: 'Persona 1 de 3',
    });
    expect(repository.charge).toHaveBeenCalledWith('orden-uuid', {
      methodId: 2,
      tip: 0,
      amount: 100,
      label: 'Persona 1 de 3',
      received: undefined,
    });
  });

  it('si la parte es todo lo que falta no manda monto (el API cobra el resto exacto)', async () => {
    const repository = makeOrderRepository();
    await new ChargeOrderUseCase(repository).execute(order, debit, { tip: 0, amount: 336 });
    expect(repository.charge).toHaveBeenCalledWith(
      'orden-uuid',
      expect.objectContaining({ amount: undefined }),
    );
  });

  it('no deja cobrar más de lo que falta; en efectivo valida contra la parte', async () => {
    const repository = makeOrderRepository();
    await expect(
      new ChargeOrderUseCase(repository).execute(order, debit, { tip: 0, amount: 400 }),
    ).rejects.toThrow('El monto excede lo que falta por cobrar ($336.00).');
    await expect(
      new ChargeOrderUseCase(repository).execute(order, cash, { tip: 0, amount: 100, received: 100 }),
    ).resolves.toBeDefined();
    expect(repository.charge).toHaveBeenCalledTimes(1);
  });
});

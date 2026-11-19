import { AppError } from '../../../../core/errors/AppError';
import type { PaymentGateway } from '../ports/PaymentGateway';
import {
  CheckoutUseCase,
  NOT_CONFIRMED,
  NOTHING_TO_CHARGE,
  PARTIAL_NOT_ALLOWED,
} from '../usecases/CheckoutUseCase';

const ORDER = { id: 'orden-1', remaining: 215, paymentsCount: 0 };

function setup(outcome: Awaited<ReturnType<PaymentGateway['pay']>> = { status: 'paid' }) {
  const repository = {
    createCardIntent: jest.fn().mockResolvedValue({ clientSecret: 'pi_1_secret_2' }),
    getDetail: jest.fn().mockResolvedValue({ status: 'pagada', remaining: 0 }),
  };
  // Mock del adapter de Stripe (#339): la fachada se prueba sin el SDK.
  const gateway: jest.Mocked<PaymentGateway> = {
    isAvailable: jest.fn().mockReturnValue(true),
    pay: jest.fn().mockResolvedValue(outcome),
  };
  const wait = jest.fn().mockResolvedValue(undefined);
  const useCase = new CheckoutUseCase(repository as never, gateway, { attempts: 3, wait });
  return { useCase, repository, gateway, wait };
}

describe('CheckoutUseCase', () => {
  it('éxito: pide la intención al API, cobra con la tarjeta y espera a que el servidor lo marque pagado', async () => {
    const { useCase, repository, gateway } = setup();

    await expect(useCase.execute(ORDER)).resolves.toEqual({ status: 'paid' });

    expect(repository.createCardIntent).toHaveBeenCalledWith('orden-1');
    expect(gateway.pay).toHaveBeenCalledWith({ clientSecret: 'pi_1_secret_2' });
    expect(repository.getDetail).toHaveBeenCalledWith('orden-1');
  });

  it('tarjeta rechazada: devuelve el motivo y no consulta el pedido', async () => {
    const { useCase, repository } = setup({ status: 'failed', message: 'Tu tarjeta fue rechazada.' });

    await expect(useCase.execute(ORDER)).resolves.toEqual({
      status: 'failed',
      message: 'Tu tarjeta fue rechazada.',
    });
    expect(repository.getDetail).not.toHaveBeenCalled();
  });

  it('la persona cierra la hoja de pago: queda cancelado sin cobrar', async () => {
    const { useCase } = setup({ status: 'cancelled' });

    await expect(useCase.execute(ORDER)).resolves.toEqual({ status: 'cancelled' });
  });

  it('red caída al pedir la intención: falla sin abrir la hoja de pago', async () => {
    const { useCase, repository, gateway } = setup();
    const offline = new AppError('network', 'No hay conexión con el servidor.');
    repository.createCardIntent.mockRejectedValue(offline);

    await expect(useCase.execute(ORDER)).rejects.toBe(offline);
    expect(gateway.pay).not.toHaveBeenCalled();
  });

  it('si el webhook tarda, sigue revisando y avisa que está pendiente sin darlo por pagado', async () => {
    const { useCase, repository, wait } = setup();
    repository.getDetail.mockResolvedValue({ status: 'entregada', remaining: 215 });

    await expect(useCase.execute(ORDER)).resolves.toEqual({ status: 'pending', message: NOT_CONFIRMED });
    expect(repository.getDetail).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledTimes(3);
  });

  it('se confirma en cuanto el servidor lo marca pagado', async () => {
    const { useCase, repository } = setup();
    repository.getDetail
      .mockResolvedValueOnce({ status: 'entregada', remaining: 215 })
      .mockResolvedValueOnce({ status: 'pagada', remaining: 0 });

    await expect(useCase.execute(ORDER)).resolves.toEqual({ status: 'paid' });
    expect(repository.getDetail).toHaveBeenCalledTimes(2);
  });

  it('un pedido con pagos parciales en caja no se cobra con tarjeta (cobraría de más)', async () => {
    const { useCase, repository } = setup();

    await expect(useCase.execute({ ...ORDER, paymentsCount: 1 })).rejects.toThrow(PARTIAL_NOT_ALLOWED);
    expect(repository.createCardIntent).not.toHaveBeenCalled();
  });

  it('un pedido sin saldo no se cobra', async () => {
    const { useCase } = setup();

    await expect(useCase.execute({ ...ORDER, remaining: 0 })).rejects.toThrow(NOTHING_TO_CHARGE);
  });

  it('informa si el cobro con tarjeta está disponible en este build', () => {
    const { useCase, gateway } = setup();
    gateway.isAvailable.mockReturnValue(false);

    expect(useCase.isAvailable()).toBe(false);
  });
});

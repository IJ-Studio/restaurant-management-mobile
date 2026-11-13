import { initPaymentSheet, initStripe, presentPaymentSheet } from '@stripe/stripe-react-native';

import { MERCHANT_NAME, StripePaymentGateway } from '../gateways/StripePaymentGateway';

const init = jest.mocked(initPaymentSheet);
const present = jest.mocked(presentPaymentSheet);

describe('StripePaymentGateway', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    init.mockResolvedValue({} as never);
    present.mockResolvedValue({} as never);
  });

  it('solo se ofrece con una llave pública', () => {
    expect(new StripePaymentGateway('pk_test_123').isAvailable()).toBe(true);
    expect(new StripePaymentGateway('').isAvailable()).toBe(false);
    // Una llave secreta nunca debe usarse en la app aunque alguien la configure.
    expect(new StripePaymentGateway('sk_test_123').isAvailable()).toBe(false);
  });

  it('abre la hoja de pago con el clientSecret del API y devuelve pagado', async () => {
    const gateway = new StripePaymentGateway('pk_test_123');

    await expect(gateway.pay({ clientSecret: 'pi_1_secret_2' })).resolves.toEqual({ status: 'paid' });

    expect(initStripe).toHaveBeenCalledWith({ publishableKey: 'pk_test_123' });
    expect(init).toHaveBeenCalledWith({
      paymentIntentClientSecret: 'pi_1_secret_2',
      merchantDisplayName: MERCHANT_NAME,
    });
  });

  it('inicia Stripe una sola vez', async () => {
    const gateway = new StripePaymentGateway('pk_test_123');

    await gateway.pay({ clientSecret: 'a' });
    await gateway.pay({ clientSecret: 'b' });

    expect(initStripe).toHaveBeenCalledTimes(1);
  });

  it('si la persona cierra la hoja de pago queda cancelado', async () => {
    present.mockResolvedValue({ error: { code: 'Canceled', localizedMessage: 'x' } } as never);

    await expect(new StripePaymentGateway('pk_test_1').pay({ clientSecret: 'a' })).resolves.toEqual({
      status: 'cancelled',
    });
  });

  it('tarjeta rechazada: devuelve el mensaje de Stripe', async () => {
    present.mockResolvedValue({
      error: { code: 'Failed', localizedMessage: 'Tu tarjeta fue rechazada.' },
    } as never);

    await expect(new StripePaymentGateway('pk_test_1').pay({ clientSecret: 'a' })).resolves.toEqual({
      status: 'failed',
      message: 'Tu tarjeta fue rechazada.',
    });
  });

  it('si la hoja no se puede preparar, falla sin presentarla', async () => {
    init.mockResolvedValue({ error: { code: 'Failed' } } as never);

    await expect(new StripePaymentGateway('pk_test_1').pay({ clientSecret: 'a' })).resolves.toMatchObject({
      status: 'failed',
    });
    expect(present).not.toHaveBeenCalled();
  });

  it('sin llave no intenta cobrar', async () => {
    await expect(new StripePaymentGateway('').pay({ clientSecret: 'a' })).resolves.toMatchObject({
      status: 'failed',
    });
    expect(initStripe).not.toHaveBeenCalled();
  });
});

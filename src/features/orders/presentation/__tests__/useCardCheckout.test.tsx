import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppError } from '../../../../core/errors/AppError';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import type { OrderDetail } from '../../domain/entities/ActiveOrder';
import { useCardCheckout } from '../viewmodels/useCardCheckout';

const order = (overrides: Partial<OrderDetail> = {}) =>
  ({ id: 'orden-1', remaining: 215, payments: [], ...overrides }) as OrderDetail;

function Probe({ detail }: { detail: OrderDetail }) {
  const card = useCardCheckout(detail);
  return (
    <>
      <Text>{card.available ? 'disponible' : 'no disponible'}</Text>
      {card.message && <Text>{card.message.text}</Text>}
      <Text onPress={card.pay}>pagar</Text>
    </>
  );
}

function setup(execute: jest.Mock, available = true) {
  return makeTestDependencies({ checkoutUseCase: { execute, isAvailable: () => available } });
}

describe('useCardCheckout', () => {
  it('se ofrece para la cuenta completa sin pagos previos', async () => {
    await renderWithProviders(<Probe detail={order()} />, setup(jest.fn()));
    expect(screen.getByText('disponible')).toBeOnTheScreen();
  });

  it.each([
    ['sin llave de Stripe en el build', order(), false],
    ['con pagos parciales', order({ payments: [{}] as OrderDetail['payments'] }), true],
    ['sin saldo', order({ remaining: 0 }), true],
  ])('no se ofrece %s', async (_caso, detail, available) => {
    await renderWithProviders(<Probe detail={detail} />, setup(jest.fn(), available));
    expect(screen.getByText('no disponible')).toBeOnTheScreen();
  });

  it.each([
    [{ status: 'paid' }, 'Pago con tarjeta aprobado. El pedido quedó pagado.'],
    [{ status: 'failed', message: 'Tu tarjeta fue rechazada.' }, 'Tu tarjeta fue rechazada.'],
    [{ status: 'pending', message: 'Aún no aparece como pagado.' }, 'Aún no aparece como pagado.'],
  ])('muestra el resultado %o', async (result, text) => {
    const execute = jest.fn().mockResolvedValue(result);
    await renderWithProviders(<Probe detail={order()} />, setup(execute));

    await fireEvent.press(screen.getByText('pagar'));

    expect(await screen.findByText(text)).toBeOnTheScreen();
    expect(execute).toHaveBeenCalledWith({ id: 'orden-1', remaining: 215, paymentsCount: 0 });
  });

  it('si falla la red lo dice', async () => {
    const execute = jest.fn().mockRejectedValue(new AppError('network', 'No hay conexión con el servidor.'));
    await renderWithProviders(<Probe detail={order()} />, setup(execute));

    await fireEvent.press(screen.getByText('pagar'));

    expect(await screen.findByText('No hay conexión con el servidor.')).toBeOnTheScreen();
  });
});

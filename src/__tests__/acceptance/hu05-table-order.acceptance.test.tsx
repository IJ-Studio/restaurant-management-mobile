/**
 * Aceptación HU-05 Tomar pedido y cobrar (#336).
 *
 * Criterios de la historia: "un pedido pagado exitosamente aparece en el historial; un pago rechazado
 * no crea un pedido confirmado y muestra el motivo al Cajero". CA-1 y CA-2 recorren el cobro con
 * tarjeta (Stripe, #338–#341) con una hoja de pago falsa; el API falso marca el pedido como pagado
 * igual que el webhook de Stripe. CA-3 y CA-4 cubren el pedido de la mesa y su envío a cocina.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { signInAs } from '../../core/testing/acceptance';
import { createFakeApi, createFakePaymentGateway } from '../../core/testing/fakeApi';
import { startTestApp, tab } from '../../core/testing/startTestApp';
import type { CardPaymentOutcome } from '../../features/orders/domain/ports/PaymentGateway';

async function startAsWaiter() {
  const app = await startTestApp();
  await signInAs('mesero');
  return app;
}

async function addDish(name: string, times = 1) {
  await fireEvent.press(await screen.findByRole('button', { name }));
  for (let i = 0; i < times; i++) {
    await fireEvent.press(await screen.findByRole('button', { name: 'Agregar al pedido' }));
  }
}

describe('HU-05 Tomar pedido y cobrar', () => {
  /** El mesero manda un pedido de la mesa 5 y el cajero abre su cobro. */
  async function openChargeAsCashier(outcome: CardPaymentOutcome) {
    const api = createFakeApi();
    const payment = createFakePaymentGateway(api, outcome);
    await startTestApp({ api, payment });
    await signInAs('mesero');
    await addDish('Enchiladas suizas, $145.50');
    await fireEvent.press(screen.getByRole('button', { name: 'Pedido de la mesa, 1 platillos' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Mesa 5' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar a cocina' }));
    await screen.findByText(/Pedido enviado a cocina/);
    await fireEvent.press(tab('Perfil')!);
    await fireEvent.press(await screen.findByRole('button', { name: 'Cerrar sesión' }));
    await signInAs('cajero');
    await fireEvent.press(await screen.findByRole('button', { name: /^Mesa 5,/ }));
    await screen.findByLabelText('Total a cobrar $145.50');
    return { api, payment };
  }

  it('HU-05 CA-1: un pedido pagado exitosamente con tarjeta queda pagado y sale de los cobros pendientes', async () => {
    // Arrange
    const { api, payment } = await openChargeAsCashier({ status: 'paid' });

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Cobrar con tarjeta en la app' }));

    // Assert
    expect(await screen.findByText('Pago con tarjeta aprobado. El pedido quedó pagado.')).toBeOnTheScreen();
    expect(api.orders.get('orden-1')?.estado).toBe('pagada');
    expect(payment.paid).toEqual(['pi_orden-1_secret_prueba']);
    const intent = api.requests.find((r) => r.path === 'pagos/crear-intento');
    // La app no manda el monto: el servidor lo calcula del pedido.
    expect(intent?.body).toEqual({ ordenId: 'orden-1' });
    await fireEvent.press(screen.getByRole('button', { name: 'Listo' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: /^Mesa 5,/ })).toBeNull());
  });

  it('HU-05 CA-2: un pago rechazado no confirma el pedido y muestra el motivo al cajero', async () => {
    // Arrange
    const { api } = await openChargeAsCashier({ status: 'failed', message: 'Tu tarjeta fue rechazada.' });

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Cobrar con tarjeta en la app' }));

    // Assert
    expect(await screen.findByText('Tu tarjeta fue rechazada.')).toBeOnTheScreen();
    expect(api.orders.get('orden-1')?.estado).toBe('abierta');
    expect(screen.getByRole('button', { name: 'Cobrar con tarjeta en la app' })).toBeOnTheScreen();
  });

  it('HU-05 CA-3: el mesero arma el pedido de la mesa y lo envía a cocina', async () => {
    // Arrange
    const { api } = await startAsWaiter();

    // Act
    await addDish('Enchiladas suizas, $145.50', 2);
    await fireEvent.press(screen.getByRole('button', { name: 'Pedido de la mesa, 2 platillos' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Mesa 5' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar a cocina' }));

    // Assert
    expect(await screen.findByText(/Pedido enviado a cocina/)).toBeOnTheScreen();
    expect(api.orders.get('orden-1')).toMatchObject({ estado: 'abierta', mesa: '5', total: 291 });
  });

  it('HU-05 CA-3: el total que cobra el restaurante lo calcula el servidor, no la app', async () => {
    // Arrange
    const { api } = await startAsWaiter();

    // Act
    await addDish('Café de olla, $45.00', 3);
    await fireEvent.press(screen.getByRole('button', { name: 'Pedido de la mesa, 3 platillos' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Mesa 2' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar a cocina' }));
    await screen.findByText(/Pedido enviado a cocina/);

    // Assert
    const created = api.requests.find((r) => r.method === 'POST' && r.path === 'pedidos/mesa');
    expect(created?.body).toEqual({ mesa: '2', items: [{ platilloId: 301, cantidad: 3 }] });
  });

  it('HU-05 CA-4: un platillo agotado no se puede agregar al pedido', async () => {
    // Arrange
    await startAsWaiter();

    // Act
    await fireEvent.press(await screen.findByRole('button', { name: 'Mole poblano, Agotado, $160.00' }));

    // Assert
    expect(await screen.findByRole('button', { name: 'Agregar al pedido' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pedido de la mesa, 0 platillos' })).toBeOnTheScreen();
  });
});

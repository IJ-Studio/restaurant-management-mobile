/**
 * Aceptación HU-05 Tomar pedido y cobrar (#336).
 *
 * Criterios de la historia: "un pedido pagado exitosamente aparece en el historial; un pago rechazado
 * no crea un pedido confirmado y muestra el motivo al Cajero". El cobro con Stripe (#338–#341) todavía
 * no está en develop, así que CA-1 y CA-2 quedan como pendientes (`it.todo`) y salen así en el reporte.
 * CA-3 y CA-4 cubren la parte ya entregada (#337): el pedido en curso de la mesa y su envío a cocina.
 */
import { fireEvent, screen } from '@testing-library/react-native';

import { signInAs } from '../../core/testing/acceptance';
import { startTestApp } from '../../core/testing/startTestApp';

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
  it.todo('HU-05 CA-1: un pedido pagado exitosamente aparece en el historial (pendiente: cobro con Stripe)');

  it.todo(
    'HU-05 CA-2: un pago rechazado no confirma el pedido y muestra el motivo al cajero (pendiente: Stripe)',
  );

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
    expect(created?.body).toEqual({ usuarioId: 3, mesa: '2', items: [{ platilloId: 301, cantidad: 3 }] });
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

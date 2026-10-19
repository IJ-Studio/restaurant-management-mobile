/**
 * Integración HU-03 + HU-05 con datos de prueba: el mesero arma el pedido desde el menú y lo manda a cocina.
 * Verifica lo que llega al API falso: solo platillo y cantidad (el precio lo pone el servidor).
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { testUsers } from '../../core/testing/data/testData';
import { loginAs, startTestApp, tab } from '../../core/testing/startTestApp';

async function startAsWaiter() {
  const app = await startTestApp();
  await loginAs(testUsers.mesero.email);
  await waitFor(() => expect(tab('Menú')).toBeOnTheScreen());
  return app;
}

describe('Integración: pedido de la mesa con datos de prueba', () => {
  it('manda el pedido a cocina y el API recibe solo platillo y cantidad', async () => {
    const { api } = await startAsWaiter();

    await fireEvent.press(await screen.findByRole('button', { name: 'Enchiladas suizas, $145.50' }));
    for (let i = 0; i < 2; i++) {
      await fireEvent.press(await screen.findByRole('button', { name: 'Agregar al pedido' }));
    }
    await fireEvent.press(screen.getByRole('button', { name: 'Pedido de la mesa, 2 platillos' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Mesa 5' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar a cocina' }));

    expect(await screen.findByText(/Pedido enviado a cocina/)).toBeOnTheScreen();

    const created = api.requests.find((r) => r.method === 'POST' && r.path === 'pedidos/mesa');
    expect(created?.body).toEqual({ usuarioId: 3, mesa: '5', items: [{ platilloId: 201, cantidad: 2 }] });
    expect(created?.authorization).toMatch(/^Bearer /);
    expect(api.requests.some((r) => r.path === 'pedidos/confirmar/orden-1')).toBe(true);
    expect(api.orders.get('orden-1')).toMatchObject({ estado: 'abierta', total: 291 });
  });

  it('muestra solo las mesas activas, en orden', async () => {
    await startAsWaiter();

    await fireEvent.press(await screen.findByRole('button', { name: 'Café de olla, $45.00' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Agregar al pedido' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Pedido de la mesa, 1 platillos' }));

    const tables = await screen.findAllByRole('radio');
    expect(tables.map((t) => t.props.accessibilityLabel)).toEqual(['Mesa 2', 'Mesa 5', 'Mesa 10']);
  });

  it('un platillo agotado en el API no se puede agregar', async () => {
    await startAsWaiter();

    await fireEvent.press(await screen.findByRole('button', { name: 'Mole poblano, Agotado, $160.00' }));

    expect(await screen.findByRole('button', { name: 'Agregar al pedido' })).toBeDisabled();
  });
});

/**
 * Integración HU-06 + HU-08 con datos de prueba: el pedido que manda el mesero aparece en la pestaña
 * Pedidos con su detalle, y el Dashboard del administrador junta totales, mesas y pedidos del API.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { testUsers } from '../../core/testing/data/testData';
import { loginAs, startTestApp, tab } from '../../core/testing/startTestApp';

describe('Integración: pedidos y dashboard con datos de prueba', () => {
  it('el pedido enviado a cocina aparece en Pedidos y se puede abrir', async () => {
    const { api } = await startTestApp();
    await loginAs(testUsers.mesero.email);
    await waitFor(() => expect(tab('Menú')).toBeOnTheScreen());

    await fireEvent.press(await screen.findByRole('button', { name: 'Enchiladas suizas, $145.50' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Agregar al pedido' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Pedido de la mesa, 1 platillos' }));
    await fireEvent.press(await screen.findByRole('radio', { name: 'Mesa 5' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar a cocina' }));
    await screen.findByText(/Pedido enviado a cocina/);

    await fireEvent.press(tab('Pedidos')!);
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Mesa 5, En cocina, Cliente de mesa, $145.50' }),
    );

    expect(await screen.findByText('Enchiladas suizas')).toBeOnTheScreen();
    expect(screen.getByText('En cocina')).toBeOnTheScreen();
    const detail = api.requests.find((r) => r.path === 'pedidos/usuario');
    expect(detail?.authorization).toMatch(/^Bearer /);
  });

  it('el Dashboard del administrador muestra totales y mesas del API', async () => {
    const { api } = await startTestApp();
    await loginAs(testUsers.admin.email);

    expect(await screen.findByLabelText('Ventas del día, $0.00')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mesa 2, Libre, 2 lugares')).toBeOnTheScreen();
    // La mesa 8 está inactiva: no aparece.
    expect(screen.queryByLabelText(/^Mesa 8,/)).toBeNull();
    expect(screen.getByText('Sin pedidos activos por ahora.')).toBeOnTheScreen();

    const paths = api.requests.map((r) => r.path);
    expect(paths).toEqual(
      expect.arrayContaining(['dashboard/admin/stats', 'mesas', 'reservations/map', 'pedidos/admin/recent']),
    );
  });
});

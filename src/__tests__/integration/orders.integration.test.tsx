/**
 * Integración HU-05/06/08 con datos de prueba: un pedido recorre la app de todos los roles contra
 * el API falso (mismas reglas de estatus, roles y cobro que el API real), y el Dashboard del
 * administrador junta totales, mesas y pedidos.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { testUsers } from '../../core/testing/data/testData';
import { loginAs, startTestApp, tab } from '../../core/testing/startTestApp';

jest.setTimeout(30_000);

/** Cierra sesión: en el celular compartido del restaurante entra el siguiente rol en la misma app. */
async function signOut() {
  await fireEvent.press(tab('Perfil')!);
  await fireEvent.press(await screen.findByRole('button', { name: 'Cerrar sesión' }));
  await screen.findByRole('button', { name: 'Entrar' });
}

async function sendOrderAsWaiter() {
  const app = await startTestApp();
  await loginAs(testUsers.mesero.email);
  await waitFor(() => expect(tab('Menú')).toBeOnTheScreen());
  await fireEvent.press(await screen.findByRole('button', { name: 'Enchiladas suizas, $145.50' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Agregar al pedido' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Pedido de la mesa, 1 platillos' }));
  await fireEvent.press(await screen.findByRole('radio', { name: 'Mesa 5' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Enviar a cocina' }));
  await screen.findByText(/Pedido enviado a cocina/);
  return app;
}

describe('Integración: pedidos y dashboard con datos de prueba', () => {
  it('el pedido enviado aparece en Pedidos y su detalle sale de GET /pedidos/:id', async () => {
    const { api } = await sendOrderAsWaiter();

    await fireEvent.press(tab('Pedidos')!);
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Mesa 5, En cocina, Cliente de mesa, $145.50' }),
    );

    expect(await screen.findByText('Enchiladas suizas')).toBeOnTheScreen();
    const detail = api.requests.find((r) => r.method === 'GET' && r.path === 'pedidos/orden-1');
    expect(detail?.authorization).toMatch(/^Bearer /);
  });

  it('recorre el flujo completo: mesero → cocina → mesero → caja', async () => {
    const { api } = await sendOrderAsWaiter();
    await signOut();

    // Cocina: empieza y marca listo.
    await loginAs(testUsers.cocina.email);
    await fireEvent.press(await screen.findByRole('button', { name: 'Empezar a preparar: Mesa 5' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Marcar como lista: Mesa 5' }));
    await waitFor(() => expect(api.orders.get('orden-1')?.estado).toBe('lista'));
    await signOut();

    // Mesero: lo entrega.
    await loginAs(testUsers.mesero.email);
    await waitFor(() => expect(tab('Pedidos')).toBeOnTheScreen());
    await fireEvent.press(tab('Pedidos')!);
    await fireEvent.press(await screen.findByRole('button', { name: 'Entregar en la mesa: Mesa 5' }));
    await waitFor(() => expect(api.orders.get('orden-1')?.estado).toBe('entregada'));
    await signOut();

    // Caja: lo cobra en efectivo con cambio.
    await loginAs(testUsers.cajero.email);
    await fireEvent.press(await screen.findByRole('button', { name: /^Mesa 5, Por cobrar/ }));
    await screen.findByLabelText('Total a cobrar $145.50');
    await fireEvent.press(screen.getByRole('button', { name: 'Recibí $200.00' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar cobro' }));

    expect(await screen.findByText('Cobrado $145.50')).toBeOnTheScreen();
    expect(screen.getByText('$54.50')).toBeOnTheScreen();
    expect(api.orders.get('orden-1')?.estado).toBe('pagada');
    const charge = api.requests.find((r) => r.path === 'pedidos/orden-1/cobrar');
    // La app no manda el monto del pedido: solo método y efectivo recibido.
    expect(charge?.body).toEqual({ metodoPagoId: 1, montoRecibido: 200 });
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

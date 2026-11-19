/**
 * Integración HU-07 con datos de prueba: explicación previa al permiso, registro del teléfono en el
 * API y apertura del pedido al tocar un aviso. Solo se sustituyen la red y las notificaciones del teléfono.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { testUsers } from '../../core/testing/data/testData';
import { createFakePushNotifications } from '../../core/testing/fakeApi';
import { loginAs, startTestApp, tab } from '../../core/testing/startTestApp';
import { useNotificationStore } from '../../features/notifications/presentation/store/notificationStore';

const TOKEN = 'ExponentPushToken[telefono-de-prueba]';
const deviceRequests = (api: Awaited<ReturnType<typeof startTestApp>>['api']) =>
  api.requests.filter((r) => r.path.startsWith('notifications/devices'));

describe('Integración: notificaciones push', () => {
  beforeEach(() => useNotificationStore.setState({ permission: null, rationaleDismissed: false }));

  it('con el permiso concedido, al iniciar sesión registra el teléfono con el token del usuario', async () => {
    const { api } = await startTestApp();
    await loginAs(testUsers.mesero.email);

    await waitFor(() => expect(deviceRequests(api)).toHaveLength(1));
    expect(deviceRequests(api)[0]).toMatchObject({
      method: 'POST',
      path: 'notifications/devices',
      body: { token: TOKEN },
    });
    expect(deviceRequests(api)[0].authorization).toMatch(/^Bearer /);
  });

  it('sin permiso todavía, primero explica y no registra nada hasta que la persona acepta', async () => {
    const push = createFakePushNotifications({ status: 'undetermined', canAskAgain: true });
    const { api } = await startTestApp({ push });
    await loginAs(testUsers.cocina.email);

    expect(await screen.findByRole('header', { name: 'Avisos de pedidos' })).toBeOnTheScreen();
    expect(deviceRequests(api)).toHaveLength(0);

    await fireEvent.press(screen.getByRole('button', { name: 'Activar avisos' }));

    await waitFor(() => expect(deviceRequests(api)).toHaveLength(1));
    expect(screen.queryByRole('header', { name: 'Avisos de pedidos' })).toBeNull();
  });

  it('al cerrar sesión da de baja el teléfono antes de salir, con la sesión todavía válida', async () => {
    const { api } = await startTestApp();
    await loginAs(testUsers.cajero.email);
    await waitFor(() => expect(deviceRequests(api)).toHaveLength(1));

    await fireEvent.press(tab('Perfil')!);
    await fireEvent.press(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeOnTheScreen();
    const paths = api.requests.map((r) => `${r.method} ${r.path}`);
    // El API falso guarda la ruta ya decodificada.
    const removal = paths.indexOf(`DELETE notifications/devices/${TOKEN}`);
    expect(removal).toBeGreaterThan(-1);
    expect(removal).toBeLessThan(paths.indexOf('POST auth/sign-out'));
    expect(api.requests[removal].authorization).toMatch(/^Bearer /);
  });

  it('tocar el aviso de un pedido listo abre ese pedido', async () => {
    const { api, push } = await startTestApp();
    await loginAs(testUsers.mesero.email);
    await waitFor(() => expect(tab('Pedidos')).toBeOnTheScreen());

    await act(async () =>
      push.open({
        title: 'Pedido listo',
        body: 'Mesa B01: listo para entregar.',
        data: { type: 'order_ready', orderId: 'pedido-1', place: 'Mesa B01' },
      }),
    );

    // La pantalla del pedido se abre y pide ese pedido al API con el token del mesero.
    await waitFor(() => expect(api.requests.some((r) => r.path === 'pedidos/pedido-1')).toBe(true));
    expect(api.requests.find((r) => r.path === 'pedidos/pedido-1')?.authorization).toMatch(/^Bearer /);
  });
});

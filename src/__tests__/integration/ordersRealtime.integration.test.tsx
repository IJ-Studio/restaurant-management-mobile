/**
 * Integración HU-06: la lista de pedidos se actualiza sola cuando llega un cambio por el flujo en
 * tiempo real, sin que la persona refresque. Se sustituye solo la red y el flujo.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { testUsers } from '../../core/testing/data/testData';
import { loginAs, startTestApp, tab } from '../../core/testing/startTestApp';

const listRequests = (api: Awaited<ReturnType<typeof startTestApp>>['api']) =>
  api.requests.filter((r) => r.path === 'pedidos/admin/recent').length;

describe('Integración: pedidos en tiempo real', () => {
  it('cocina abre el flujo al entrar y lo cierra al salir', async () => {
    const { events } = await startTestApp();
    await loginAs(testUsers.cocina.email);
    await waitFor(() => expect(tab('Pedidos')).toBeOnTheScreen());

    expect(events.subscribers()).toBe(1);

    await fireEvent.press(tab('Perfil')!);
    await fireEvent.press(await screen.findByRole('button', { name: 'Cerrar sesión' }));
    await waitFor(() => expect(events.subscribers()).toBe(0));
  });

  it('un pedido que cambia en otro teléfono hace que la lista se vuelva a pedir al momento', async () => {
    const { api, events } = await startTestApp();
    await loginAs(testUsers.cocina.email);
    await waitFor(() => expect(tab('Pedidos')).toBeOnTheScreen());
    await waitFor(() => expect(listRequests(api)).toBeGreaterThan(0));
    const before = listRequests(api);

    await act(async () => events.emit({ change: 'sent', orderId: 'pedido-nuevo' }));

    await waitFor(() => expect(listRequests(api)).toBe(before + 1));
  });
});

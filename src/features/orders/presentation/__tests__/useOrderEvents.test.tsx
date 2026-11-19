import { QueryClient } from '@tanstack/react-query';
import { act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { createFakeOrderEvents } from '../../../../core/testing/fakeApi';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeSession } from '../../../auth/__fixtures__/auth';
import type { ActiveOrder } from '../../domain/entities/ActiveOrder';
import { orderQueryKeys } from '../viewmodels/orderQueryKeys';
import { applyOrderEvent, useOrderEvents } from '../viewmodels/useOrderEvents';

const order = (id: string, status: string) => ({ id, status }) as ActiveOrder;

describe('applyOrderEvent', () => {
  it('con estatus conocido cambia la lista al instante y pide los datos afectados', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(orderQueryKeys.active, [
      order('o-1', 'en_preparacion'),
      order('o-2', 'abierta'),
    ]);
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();

    await applyOrderEvent(queryClient, { change: 'status', orderId: 'o-1', status: 'lista' });

    expect(queryClient.getQueryData<ActiveOrder[]>(orderQueryKeys.active)?.map((o) => o.status)).toEqual([
      'lista',
      'abierta',
    ]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orderQueryKeys.detail('o-1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
  });

  it('sin estatus conocido (p. ej. platillos nuevos) solo vuelve a pedir la lista', async () => {
    const queryClient = new QueryClient();
    const before = [order('o-1', 'pendiente')];
    queryClient.setQueryData(orderQueryKeys.active, before);
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();

    await applyOrderEvent(queryClient, { change: 'items', orderId: 'o-1' });

    expect(queryClient.getQueryData(orderQueryKeys.active)).toBe(before);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orderQueryKeys.active });
  });
});

function Probe() {
  useOrderEvents();
  return <Text>activo</Text>;
}

describe('useOrderEvents', () => {
  it('con sesión se suscribe y al cerrar sesión se desuscribe', async () => {
    const events = createFakeOrderEvents();
    const deps = makeTestDependencies({ orderEvents: events });
    deps.sessionStore.getState().setSession(makeSession());

    await renderWithProviders(<Probe />, deps);
    expect(events.subscribers()).toBe(1);

    await act(() => deps.sessionStore.getState().clearSession());
    expect(events.subscribers()).toBe(0);
  });

  it('si el token se renueva, abre un flujo nuevo con él', async () => {
    const events = createFakeOrderEvents();
    const subscribe = jest.spyOn(events, 'subscribe');
    const deps = makeTestDependencies({ orderEvents: events });
    deps.sessionStore.getState().setSession(makeSession({ token: 'viejo' }));
    await renderWithProviders(<Probe />, deps);

    await act(() => deps.sessionStore.getState().setSession(makeSession({ token: 'nuevo' })));

    expect(subscribe).toHaveBeenCalledTimes(2);
    expect(events.subscribers()).toBe(1);
  });

  it('sin sesión no se suscribe', async () => {
    const events = createFakeOrderEvents();
    await renderWithProviders(<Probe />, makeTestDependencies({ orderEvents: events }));

    expect(events.subscribers()).toBe(0);
  });

  it('cada evento actualiza la caché y al reconectar se sincroniza todo una vez', async () => {
    const events = createFakeOrderEvents();
    const deps = makeTestDependencies({ orderEvents: events });
    deps.sessionStore.getState().setSession(makeSession());
    const queryClient = new QueryClient();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();
    await renderWithProviders(<Probe />, deps, queryClient);

    await act(async () => events.ready());
    expect(invalidate).not.toHaveBeenCalled();

    await act(async () => events.emit({ change: 'charged', orderId: 'o-9' }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orderQueryKeys.detail('o-9') });

    invalidate.mockClear();
    await act(async () => events.ready());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orderQueryKeys.all });
  });
});

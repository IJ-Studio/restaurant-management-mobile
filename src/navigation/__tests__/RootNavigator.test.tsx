import { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { Dependencies } from '../../core/di/dependencies';
import { HttpClient } from '../../core/http/httpClient';
import { AppProviders } from '../../core/providers/AppProviders';
import type { Session } from '../../features/auth/domain/entities/Session';
import type { Role } from '../../features/auth/domain/entities/User';
import { useSessionStore } from '../../features/auth/presentation/store/sessionStore';
import { useCurrentOrderStore } from '../../features/orders/presentation/store/currentOrderStore';
import { RootNavigator } from '../RootNavigator';

/** Sin timers de recolección: evita que Jest quede esperando al terminar. */
const testQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });

function sessionFor(role: Role): Session {
  return { token: 'token.de.sesion', user: { id: '1', name: 'Ana', lastname: 'López', email: 'ana@resto.mx', role } };
}

async function setup(stored: Session | null | Error) {
  const fetchFn = jest.fn();
  const httpClient = new HttpClient({ baseUrl: 'https://api.test', timeoutMs: 1000, allowInsecure: false, fetchFn });
  const dependencies = {
    httpClient,
    loginUseCase: { execute: jest.fn() },
    logoutUseCase: { execute: jest.fn().mockResolvedValue(undefined) },
    getMenuUseCase: { execute: jest.fn().mockResolvedValue([]) },
    getDishUseCase: { execute: jest.fn() },
    createReservationUseCase: { execute: jest.fn() },
    getActiveReservationsUseCase: { execute: jest.fn().mockResolvedValue([]) },
    getDashboardUseCase: { execute: jest.fn(() => new Promise(() => {})) },
    restoreSessionUseCase: {
      execute: stored instanceof Error ? jest.fn().mockRejectedValue(stored) : jest.fn().mockResolvedValue(stored),
    },
  } as unknown as Dependencies;
  const view = await render(
    <AppProviders dependencies={dependencies} queryClient={testQueryClient()}>
      <RootNavigator />
    </AppProviders>,
  );
  return { view, fetchFn, httpClient, dependencies };
}

/** Botones de la barra de tabs (las pantallas también tienen botones propios). */
const tabTitles = () =>
  screen
    .getAllByRole('button')
    .filter((button) => button.props.accessibilityLargeContentTitle)
    .map((tab) => tab.props.accessibilityLabel ?? '');

describe('RootNavigator: sesión (HU-01)', () => {
  beforeEach(() => useSessionStore.setState({ status: 'checking', session: null }));

  it('muestra el Login si no hay sesión guardada', async () => {
    await setup(null);
    expect(await screen.findByText('Iniciar sesión')).toBeOnTheScreen();
  });

  it('la sesión sobrevive a cerrar y abrir la app (se hidrata desde secure-store)', async () => {
    await setup(sessionFor('cajero'));
    expect(await screen.findByLabelText('Pedidos', { exact: false })).toBeOnTheScreen();
    expect(screen.queryByText('Iniciar sesión')).toBeNull();
  });

  it('el httpClient inyecta el token de la sesión', async () => {
    const { fetchFn, httpClient } = await setup(sessionFor('cajero'));
    await screen.findAllByText('Pedidos');
    fetchFn.mockResolvedValue(new Response('{}', { status: 200 }));

    await httpClient.get('auth/me');
    expect(fetchFn.mock.calls[0][1].headers.Authorization).toBe('Bearer token.de.sesion');
  });

  it('un 401 del API (token vencido o manipulado) cierra la sesión', async () => {
    const { fetchFn, httpClient, dependencies } = await setup(sessionFor('cajero'));
    await screen.findAllByText('Pedidos');
    fetchFn.mockResolvedValue(new Response('{"message":"Unauthorized"}', { status: 401 }));

    await act(async () => {
      await expect(httpClient.get('auth/me')).rejects.toMatchObject({ kind: 'unauthorized' });
    });

    expect(await screen.findByText('Iniciar sesión')).toBeOnTheScreen();
    expect(dependencies.logoutUseCase.execute).toHaveBeenCalledWith({ revoke: false });
  });

  it('cerrar sesión desde Perfil regresa al Login y descarta los pedidos en curso', async () => {
    const { dependencies } = await setup(sessionFor('mesero'));
    await act(async () => {
      useCurrentOrderStore.getState().openTable('3');
      useCurrentOrderStore.getState().addDish({ id: '1', name: 'Tacos', price: 10, available: true });
    });
    await fireEvent.press(await screen.findByLabelText('Perfil', { exact: false }));
    await fireEvent.press(await screen.findByText('Cerrar sesión'));

    expect(await screen.findByText('Iniciar sesión')).toBeOnTheScreen();
    expect(dependencies.logoutUseCase.execute).toHaveBeenCalledWith();
    expect(useSessionStore.getState().session).toBeNull();
    expect(useCurrentOrderStore.getState().orders).toEqual({});
  });

  it('si leer la sesión guardada falla, muestra el Login', async () => {
    await setup(new Error('keystore'));
    expect(await screen.findByText('Iniciar sesión')).toBeOnTheScreen();
  });
});

describe('RootNavigator: tabs por rol (HU-02)', () => {
  beforeEach(() => useSessionStore.setState({ status: 'checking', session: null }));

  it.each<[Role, string[]]>([
    ['admin', ['Dashboard', 'Pedidos', 'Reservaciones', 'Menú', 'Perfil']],
    ['cajero', ['Pedidos', 'Reservaciones', 'Menú', 'Perfil']],
    ['mesero', ['Menú', 'Pedidos', 'Reservaciones', 'Perfil']],
    ['cocina', ['Cocina', 'Perfil']],
  ])('%s solo ve sus tabs', async (role, expected) => {
    await setup(sessionFor(role));
    await screen.findByLabelText('Perfil', { exact: false });

    const titles = tabTitles();
    expect(titles).toHaveLength(expected.length);
    expected.forEach((title, index) => expect(titles[index]).toContain(title));
  });

  it('un Mesero no tiene acceso al Dashboard del Administrador', async () => {
    await setup(sessionFor('mesero'));
    await screen.findByLabelText('Perfil', { exact: false });
    expect(screen.queryByLabelText(/^Dashboard,/)).toBeNull();
    expect(screen.queryByText('Dashboard')).toBeNull();
  });

  it('el Administrador no ve la pantalla de Cocina', async () => {
    await setup(sessionFor('admin'));
    await screen.findByLabelText('Perfil', { exact: false });
    expect(screen.queryByLabelText('Cocina', { exact: false })).toBeNull();
  });

  it('cada rol abre en su pantalla de inicio', async () => {
    await setup(sessionFor('cocina'));
    expect(await screen.findByText('Pedidos en cocina')).toBeOnTheScreen();
  });

  it('si cambia el rol, las tabs se reconstruyen para el nuevo rol', async () => {
    await setup(sessionFor('admin'));
    await screen.findByLabelText(/^Dashboard,/);

    await act(async () => useSessionStore.getState().setSession(sessionFor('cocina')));

    expect(await screen.findByText('Pedidos en cocina')).toBeOnTheScreen();
    expect(screen.queryByLabelText(/^Dashboard,/)).toBeNull();
  });
});

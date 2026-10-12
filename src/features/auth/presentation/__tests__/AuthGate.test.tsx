import { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { Dependencies } from '../../../../core/di/dependencies';
import { HttpClient } from '../../../../core/http/httpClient';
import { AppProviders } from '../../../../core/providers/AppProviders';
import type { Session } from '../../domain/entities/Session';
import { AuthGate } from '../screens/AuthGate';
import { useSessionStore } from '../store/sessionStore';

/** Sin timers de recolección: evita que Jest quede esperando al terminar. */
const testQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });

const session: Session = {
  token: 'token.de.sesion',
  user: { id: '1', name: 'Ana', lastname: 'L', email: 'ana@resto.mx', role: 'cajero' },
};

async function setup(stored: Session | null | Error) {
  const fetchFn = jest.fn();
  const httpClient = new HttpClient({ baseUrl: 'https://api.test', timeoutMs: 1000, allowInsecure: false, fetchFn });
  const dependencies = {
    httpClient,
    loginUseCase: { execute: jest.fn() },
    logoutUseCase: { execute: jest.fn().mockResolvedValue(undefined) },
    restoreSessionUseCase: {
      execute: stored instanceof Error ? jest.fn().mockRejectedValue(stored) : jest.fn().mockResolvedValue(stored),
    },
  } as unknown as Dependencies;
  const view = await render(
    <AppProviders dependencies={dependencies} queryClient={testQueryClient()}>
      <AuthGate />
    </AppProviders>,
  );
  return { view, fetchFn, httpClient, dependencies };
}

describe('AuthGate', () => {
  beforeEach(() => useSessionStore.setState({ status: 'checking', session: null }));

  it('muestra el Login si no hay sesión guardada', async () => {
    await setup(null);
    expect(await screen.findByText('Iniciar sesión')).toBeOnTheScreen();
  });

  it('la sesión sobrevive a cerrar y abrir la app (se hidrata desde secure-store)', async () => {
    await setup(session);
    expect(await screen.findByText('Hola, Ana')).toBeOnTheScreen();
    expect(screen.getByText('Cajero')).toBeOnTheScreen();
  });

  it('el httpClient inyecta el token de la sesión', async () => {
    const { fetchFn, httpClient } = await setup(session);
    await screen.findByText('Hola, Ana');
    fetchFn.mockResolvedValue(new Response('{}', { status: 200 }));

    await httpClient.get('auth/me');
    expect(fetchFn.mock.calls[0][1].headers.Authorization).toBe('Bearer token.de.sesion');
  });

  it('un 401 del API (token vencido o manipulado) cierra la sesión', async () => {
    const { fetchFn, httpClient, dependencies } = await setup(session);
    await screen.findByText('Hola, Ana');
    fetchFn.mockResolvedValue(new Response('{"message":"Unauthorized"}', { status: 401 }));

    await act(async () => {
      await expect(httpClient.get('auth/me')).rejects.toMatchObject({ kind: 'unauthorized' });
    });

    expect(await screen.findByText('Iniciar sesión')).toBeOnTheScreen();
    expect(dependencies.logoutUseCase.execute).toHaveBeenCalledWith({ revoke: false });
  });

  it('cerrar sesión regresa al Login', async () => {
    const { dependencies } = await setup(session);
    await fireEvent.press(await screen.findByText('Cerrar sesión'));

    expect(await screen.findByText('Iniciar sesión')).toBeOnTheScreen();
    expect(dependencies.logoutUseCase.execute).toHaveBeenCalledWith();
    expect(useSessionStore.getState().session).toBeNull();
  });

  it('si leer la sesión guardada falla, muestra el Login', async () => {
    await setup(new Error('keystore'));
    expect(await screen.findByText('Iniciar sesión')).toBeOnTheScreen();
  });
});

import { QueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Dependencies } from '../../../../core/di/dependencies';
import { AppError } from '../../../../core/errors/AppError';
import type { HttpClient } from '../../../../core/http/httpClient';
import { AppProviders } from '../../../../core/providers/AppProviders';
import type { Session } from '../../domain/entities/Session';
import { INVALID_CREDENTIALS } from '../../domain/usecases/LoginUseCase';
import { LoginScreen } from '../screens/LoginScreen';
import { useSessionStore } from '../store/sessionStore';

/** Sin timers de recolección: evita que Jest quede esperando al terminar. */
const testQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });

const session: Session = {
  token: 'a.b.c',
  user: { id: '1', name: 'Ana', lastname: 'L', email: 'ana@resto.mx', role: 'mesero' },
};

function renderLogin(execute: jest.Mock) {
  const dependencies = {
    httpClient: {} as HttpClient,
    loginUseCase: { execute },
    logoutUseCase: { execute: jest.fn() },
    restoreSessionUseCase: { execute: jest.fn() },
  } as unknown as Dependencies;
  return render(
    <AppProviders dependencies={dependencies} queryClient={testQueryClient()}>
      <LoginScreen />
    </AppProviders>,
  );
}

async function fillAndSubmit(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText('Correo'), email);
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), password);
  await fireEvent.press(screen.getByRole('button'));
}

describe('LoginScreen', () => {
  beforeEach(() => useSessionStore.setState({ status: 'unauthenticated', session: null }));

  it('no tiene enlace de registro: las cuentas las crea el Administrador', async () => {
    await renderLogin(jest.fn());
    expect(screen.queryByText(/regístrate|crear cuenta|registro/i)).toBeNull();
  });

  it('oculta la contraseña', async () => {
    await renderLogin(jest.fn());
    expect(screen.getByLabelText('Contraseña').props.secureTextEntry).toBe(true);
  });

  it('valida los campos requeridos sin llamar al API', async () => {
    const execute = jest.fn();
    await renderLogin(execute);

    await fireEvent.press(screen.getByRole('button'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ingresa tu correo y tu contraseña.');
    expect(execute).not.toHaveBeenCalled();
  });

  it('con credenciales válidas guarda la sesión en el store', async () => {
    const execute = jest.fn().mockResolvedValue(session);
    await renderLogin(execute);

    await fillAndSubmit('ana@resto.mx', 'secreto123');

    expect(execute).toHaveBeenCalledWith({ email: 'ana@resto.mx', password: 'secreto123' });
    expect(useSessionStore.getState()).toMatchObject({ status: 'authenticated', session });
  });

  it('muestra un error claro con credenciales inválidas', async () => {
    const execute = jest.fn().mockRejectedValue(new AppError('unauthorized', INVALID_CREDENTIALS, 401));
    await renderLogin(execute);

    await fillAndSubmit('ana@resto.mx', 'incorrecta');

    expect(await screen.findByRole('alert')).toHaveTextContent(INVALID_CREDENTIALS);
    expect(useSessionStore.getState().status).toBe('unauthenticated');
  });

  it('avisa cuando no hay conexión', async () => {
    const execute = jest.fn().mockRejectedValue(new AppError('network', 'No hay conexión con el servidor.'));
    await renderLogin(execute);

    await fillAndSubmit('ana@resto.mx', 'secreto123');

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión con el servidor.');
  });

  it('muestra un mensaje genérico ante un error inesperado', async () => {
    const execute = jest.fn().mockRejectedValue(new Error('boom'));
    await renderLogin(execute);

    await fillAndSubmit('ana@resto.mx', 'secreto123');

    expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado.');
  });

  it('muestra el estado de carga y evita envíos dobles', async () => {
    const execute = jest.fn(() => new Promise<Session>(() => {}));
    await renderLogin(execute);

    await fillAndSubmit('ana@resto.mx', 'secreto123');
    expect(await screen.findByLabelText('Iniciando sesión')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button'));
    expect(execute).toHaveBeenCalledTimes(1);
  });
});

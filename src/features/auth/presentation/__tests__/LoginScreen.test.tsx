import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '../../../../core/errors/AppError';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeAuthDependencies, makeSession } from '../../__fixtures__/auth';
import { LoginScreen } from '../screens/LoginScreen';

async function fillAndSubmit(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText('Correo'), email);
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), password);
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginScreen', () => {
  it('muestra los errores de validación sin llamar al caso de uso', async () => {
    const deps = makeAuthDependencies();
    await renderWithProviders(<LoginScreen />, deps);

    await fillAndSubmit('ana', '123');

    expect(screen.getByText('Ingresa un correo válido.')).toBeOnTheScreen();
    expect(screen.getByText(/al menos 8 caracteres/)).toBeOnTheScreen();
    expect(deps.loginUseCase.execute).not.toHaveBeenCalled();
  });

  it('con credenciales válidas inicia sesión y guarda la sesión en el store', async () => {
    const session = makeSession();
    const deps = makeAuthDependencies({ loginUseCase: { execute: jest.fn().mockResolvedValue(session) } });
    await renderWithProviders(<LoginScreen />, deps);

    await fillAndSubmit('ana@quijote.mx', 'Pass#2026');

    await waitFor(() => expect(deps.sessionStore.getState().session).toBe(session));
    expect(deps.loginUseCase.execute).toHaveBeenCalledWith({
      email: 'ana@quijote.mx',
      password: 'Pass#2026',
    });
  });

  it('con credenciales inválidas muestra un mensaje claro', async () => {
    const deps = makeAuthDependencies({
      loginUseCase: {
        execute: jest
          .fn()
          .mockRejectedValue(new AppError('unauthorized', 'Correo o contraseña incorrectos.')),
      },
    });
    await renderWithProviders(<LoginScreen />, deps);

    await fillAndSubmit('ana@quijote.mx', 'Equivocada1');

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
    expect(deps.sessionStore.getState().session).toBeNull();
  });

  it('con la red caída muestra el error de conexión', async () => {
    const deps = makeAuthDependencies({
      loginUseCase: {
        execute: jest.fn().mockRejectedValue(new AppError('network', 'No hay conexión con el servidor.')),
      },
    });
    await renderWithProviders(<LoginScreen />, deps);

    await fillAndSubmit('ana@quijote.mx', 'Pass#2026');

    expect(await screen.findByText('No hay conexión con el servidor.')).toBeOnTheScreen();
  });

  it('usa un mensaje genérico ante errores inesperados', async () => {
    const deps = makeAuthDependencies({
      loginUseCase: { execute: jest.fn().mockRejectedValue(new Error('boom')) },
    });
    await renderWithProviders(<LoginScreen />, deps);

    await fillAndSubmit('ana@quijote.mx', 'Pass#2026');

    expect(await screen.findByText('No se pudo iniciar sesión. Inténtalo de nuevo.')).toBeOnTheScreen();
  });

  it('oculta la contraseña', async () => {
    await renderWithProviders(<LoginScreen />, makeAuthDependencies());
    expect(screen.getByLabelText('Contraseña')).toHaveProp('secureTextEntry', true);
  });
});

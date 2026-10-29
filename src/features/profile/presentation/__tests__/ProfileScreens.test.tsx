import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '../../../../core/errors/AppError';
import type { Dependencies } from '../../../../core/di/dependencies';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeSession } from '../../../auth/__fixtures__/auth';
import { ProfileNavigator } from '../navigation/ProfileNavigator';

jest.setTimeout(20_000);

const profile = { id: '7', name: 'Ana', lastname: 'López', email: 'ana@quijote.mx', phone: '+527711234567' };

function setup(overrides: Partial<Dependencies> = {}) {
  const deps = makeTestDependencies({
    getProfileUseCase: { execute: jest.fn().mockResolvedValue(profile) },
    ...overrides,
  });
  deps.sessionStore.getState().setSession(makeSession());
  return deps;
}

function renderProfile(deps: Dependencies) {
  return renderWithProviders(
    <NavigationContainer>
      <ProfileNavigator />
    </NavigationContainer>,
    deps,
  );
}

describe('Editar perfil', () => {
  it('carga los datos, guarda y muestra el nombre nuevo en el perfil', async () => {
    const session = makeSession();
    const updated = { ...session, user: { ...session.user, name: 'Ana María' } };
    const execute = jest
      .fn()
      .mockResolvedValue({ profile: { ...profile, name: 'Ana María' }, session: updated });
    const deps = setup({ updateProfileUseCase: { execute } });
    await renderProfile(deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'Editar perfil' }));
    expect(await screen.findByDisplayValue('+527711234567')).toBeOnTheScreen();
    expect(screen.getByLabelText('Correo')).toHaveProp('editable', false);

    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Ana María');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(deps.sessionStore.getState().session?.user.name).toBe('Ana María'));
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ token: session.token }), {
      name: 'Ana María',
      lastname: 'López',
      phone: '+527711234567',
    });
    expect(await screen.findByText('Ana María López')).toBeOnTheScreen();
  });

  it('valida antes de guardar y muestra el motivo del API', async () => {
    const execute = jest
      .fn()
      .mockRejectedValue(new AppError('validation', 'El teléfono debe llevar lada internacional (+52…).'));
    const deps = setup({ updateProfileUseCase: { execute } });
    await renderProfile(deps);
    await fireEvent.press(await screen.findByRole('button', { name: 'Editar perfil' }));
    await screen.findByDisplayValue('+527711234567');

    await fireEvent.changeText(screen.getByLabelText('Nombre'), ' ');
    await fireEvent.changeText(screen.getByLabelText('Teléfono'), '123');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(screen.getByText('Escribe tu nombre (máximo 50 caracteres).')).toBeOnTheScreen();
    expect(screen.getByText(/Escribe 10 dígitos/)).toBeOnTheScreen();
    expect(execute).not.toHaveBeenCalled();

    // Al escribir se borra el error de ese campo.
    await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Ana');
    expect(screen.queryByText('Escribe tu nombre (máximo 50 caracteres).')).toBeNull();

    await fireEvent.changeText(screen.getByLabelText('Teléfono'), '7711234567');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El teléfono debe llevar lada internacional (+52…).',
    );
  });

  it('si no carga el perfil lo dice', async () => {
    await renderProfile(
      setup({ getProfileUseCase: { execute: jest.fn().mockRejectedValue(new Error('boom')) } }),
    );
    await fireEvent.press(await screen.findByRole('button', { name: 'Editar perfil' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar tu perfil.');
  });
});

describe('Cambiar contraseña', () => {
  async function openChangePassword(deps: Dependencies) {
    await renderProfile(deps);
    await fireEvent.press(await screen.findByRole('button', { name: 'Cambiar contraseña' }));
    await screen.findByLabelText('Contraseña actual');
  }

  it('muestra los requisitos en vivo, cambia la contraseña y confirma', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    await openChangePassword(setup({ changePasswordUseCase: { execute } }));

    expect(screen.getByLabelText('Contraseña nueva')).toHaveProp('secureTextEntry', true);
    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar contraseña nueva' }));
    expect(screen.getByLabelText('Contraseña nueva')).toHaveProp('secureTextEntry', false);

    await fireEvent.changeText(screen.getByLabelText('Contraseña nueva'), 'nueva');
    expect(screen.getByLabelText('Una minúscula: cumple')).toBeOnTheScreen();
    expect(screen.getByLabelText('Una mayúscula: falta')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Contraseña actual'), 'Vieja#2026');
    await fireEvent.changeText(screen.getByLabelText('Contraseña nueva'), 'Nueva#2026');
    await fireEvent.changeText(screen.getByLabelText('Confirmar contraseña'), 'Nueva#2026');
    await fireEvent.press(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/^Tu contraseña se cambió./);
    expect(execute).toHaveBeenCalledWith('7', {
      current: 'Vieja#2026',
      next: 'Nueva#2026',
      confirm: 'Nueva#2026',
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Volver al perfil' }));
    expect(await screen.findByRole('button', { name: 'Cerrar sesión' })).toBeOnTheScreen();
  });

  it('no envía si no coinciden y muestra el error del API', async () => {
    const execute = jest
      .fn()
      .mockRejectedValue(new AppError('validation', 'La contraseña actual no es correcta'));
    await openChangePassword(setup({ changePasswordUseCase: { execute } }));

    await fireEvent.changeText(screen.getByLabelText('Contraseña actual'), 'Vieja#2026');
    await fireEvent.changeText(screen.getByLabelText('Contraseña nueva'), 'Nueva#2026');
    await fireEvent.changeText(screen.getByLabelText('Confirmar contraseña'), 'Otra#2026');
    await fireEvent.press(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeOnTheScreen();
    expect(execute).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Confirmar contraseña'), 'Nueva#2026');
    await fireEvent.press(screen.getByRole('button', { name: 'Cambiar contraseña' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('La contraseña actual no es correcta');
  });
});

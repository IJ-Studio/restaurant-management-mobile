import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeSession } from '../../__fixtures__/auth';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { AuthGate } from '../components/AuthGate';
import { ProfileScreen } from '../screens/ProfileScreen';

describe('AuthGate', () => {
  it('sin sesión guardada muestra el Login', async () => {
    await renderWithProviders(
      <AuthGate>
        <Text>App</Text>
      </AuthGate>,
      makeTestDependencies(),
    );

    expect(await screen.findByText('Iniciar sesión')).toBeOnTheScreen();
    expect(screen.queryByText('App')).toBeNull();
  });

  it('con sesión guardada entra directo a la app (la sesión sobrevive a cerrar/abrir)', async () => {
    const deps = makeTestDependencies({
      restoreSessionUseCase: { execute: jest.fn().mockResolvedValue(makeSession()) },
    });
    await renderWithProviders(
      <AuthGate>
        <Text>App</Text>
      </AuthGate>,
      deps,
    );

    expect(await screen.findByText('App')).toBeOnTheScreen();
  });

  it('si falla la recuperación muestra el Login', async () => {
    const deps = makeTestDependencies({
      restoreSessionUseCase: { execute: jest.fn().mockRejectedValue(new Error('keystore')) },
    });
    await renderWithProviders(
      <AuthGate>
        <Text>App</Text>
      </AuthGate>,
      deps,
    );

    expect(await screen.findByText('Iniciar sesión')).toBeOnTheScreen();
  });

  it('cerrar sesión regresa al Login', async () => {
    const deps = makeTestDependencies({
      restoreSessionUseCase: { execute: jest.fn().mockResolvedValue(makeSession()) },
    });
    await renderWithProviders(
      <AuthGate>
        <ProfileScreen />
      </AuthGate>,
      deps,
    );

    expect(await screen.findByText('Ana López')).toBeOnTheScreen();
    expect(screen.getByText('Mesero')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(screen.getByText('Iniciar sesión')).toBeOnTheScreen());
    expect(deps.logoutUseCase.execute).toHaveBeenCalled();
  });
});

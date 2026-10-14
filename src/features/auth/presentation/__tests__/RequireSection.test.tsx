import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeSession } from '../../__fixtures__/auth';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { RequireSection } from '../components/RequireSection';

describe('RequireSection', () => {
  it('muestra la sección si el rol la tiene', async () => {
    const deps = makeTestDependencies();
    deps.sessionStore.getState().setSession(makeSession());

    await renderWithProviders(
      <RequireSection section="menu">
        <Text>Menú</Text>
      </RequireSection>,
      deps,
    );
    expect(screen.getByText('Menú')).toBeOnTheScreen();
  });

  it.each([
    ['un mesero', 'mesero'],
    ['un rol alterado en el cliente', 'superadmin'],
  ])('bloquea el dashboard para %s', async (_label, role) => {
    const deps = makeTestDependencies();
    const session = makeSession();
    session.user.role = role as never;
    deps.sessionStore.getState().setSession(session);

    await renderWithProviders(
      <RequireSection section="dashboard">
        <Text>Dashboard</Text>
      </RequireSection>,
      deps,
    );
    expect(screen.queryByText('Dashboard')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('No tienes acceso a esta sección.');
  });

  it('sin sesión no muestra nada protegido', async () => {
    await renderWithProviders(
      <RequireSection section="profile">
        <Text>Perfil</Text>
      </RequireSection>,
      makeTestDependencies(),
    );
    expect(screen.queryByText('Perfil')).toBeNull();
  });
});

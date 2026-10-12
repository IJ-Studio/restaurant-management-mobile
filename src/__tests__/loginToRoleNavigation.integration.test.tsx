/**
 * Integración HU-01 + HU-02 (#366): login → sesión → navegación por rol → logout.
 * Usa el árbol real de la app (AuthGate + AppNavigator); solo los casos de uso son falsos.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { AppNavigator } from '../core/navigation/AppNavigator';
import { renderWithProviders } from '../core/testing/renderWithProviders';
import type { Role } from '../features/auth/domain/entities/Role';
import { makeAuthDependencies, makeSession } from '../features/auth/__fixtures__/auth';
import { AuthGate } from '../features/auth/presentation/components/AuthGate';

function appWithLoginAs(role: Role) {
  const session = makeSession();
  session.user.role = role;
  const deps = makeAuthDependencies({ loginUseCase: { execute: jest.fn().mockResolvedValue(session) } });
  return {
    deps,
    render: () =>
      renderWithProviders(
        <AuthGate>
          <AppNavigator />
        </AuthGate>,
        deps,
      ),
  };
}

async function login() {
  await fireEvent.changeText(await screen.findByLabelText('Correo'), 'ana@quijote.mx');
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Pass#2026');
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
}

const tab = (title: string) => screen.queryByRole('button', { name: new RegExp(`^${title}`) });

describe('Login → sesión → navegación por rol', () => {
  it('un administrador entra y ve el dashboard', async () => {
    const app = appWithLoginAs('admin');
    await app.render();
    await login();

    await waitFor(() => expect(tab('Dashboard')).toBeOnTheScreen());
    expect(screen.getByText('Indicadores del día (HU-08).')).toBeOnTheScreen();
  });

  it('un mesero entra al menú y no ve el dashboard ni cobros', async () => {
    const app = appWithLoginAs('mesero');
    await app.render();
    await login();

    await waitFor(() => expect(tab('Menú')).toBeOnTheScreen());
    expect(tab('Dashboard')).toBeNull();
    expect(tab('Cobros')).toBeNull();
  });

  it('cocina solo ve pedidos y perfil', async () => {
    const app = appWithLoginAs('cocina');
    await app.render();
    await login();

    await waitFor(() => expect(tab('Pedidos')).toBeOnTheScreen());
    expect(['Dashboard', 'Menú', 'Reservaciones', 'Cobros'].map(tab)).toEqual([null, null, null, null]);
  });

  it('al cerrar sesión vuelve al Login y se olvida el rol', async () => {
    const app = appWithLoginAs('cajero');
    await app.render();
    await login();

    await waitFor(() => expect(tab('Perfil')).toBeOnTheScreen());
    await fireEvent.press(tab('Perfil')!);
    await fireEvent.press(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('Iniciar sesión')).toBeOnTheScreen();
    expect(app.deps.sessionStore.getState().session).toBeNull();
    expect(app.deps.logoutUseCase.execute).toHaveBeenCalled();
  });
});

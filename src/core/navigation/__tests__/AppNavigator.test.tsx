import { createNavigationContainerRef } from '@react-navigation/native';
import { act, screen } from '@testing-library/react-native';

import type { Role } from '../../../features/auth/domain/entities/Role';
import { makeSession } from '../../../features/auth/__fixtures__/auth';
import { makeTestDependencies } from '../../testing/makeTestDependencies';
import { renderWithProviders } from '../../testing/renderWithProviders';
import { AppNavigator, type TabParamList } from '../AppNavigator';

const TAB_TITLES = ['Dashboard', 'Menú', 'Pedidos', 'Reservaciones', 'Cobros', 'Perfil'];

const EXPECTED_TABS: Record<Exclude<Role, 'cliente'>, string[]> = {
  admin: ['Dashboard', 'Pedidos', 'Reservaciones', 'Menú', 'Perfil'],
  mesero: ['Menú', 'Pedidos', 'Reservaciones', 'Perfil'],
  cajero: ['Cobros', 'Pedidos', 'Perfil'],
  cocina: ['Pedidos', 'Perfil'],
};

async function renderAs(role: Role) {
  const deps = makeTestDependencies();
  const session = makeSession();
  session.user.role = role;
  deps.sessionStore.getState().setSession(session);
  const navigationRef = createNavigationContainerRef<TabParamList>();
  await renderWithProviders(<AppNavigator navigationRef={navigationRef} />, deps);
  return { deps, navigationRef };
}

const tabButton = (title: string) => screen.queryByRole('button', { name: new RegExp(`^${title}`) });

describe('AppNavigator', () => {
  it.each(Object.entries(EXPECTED_TABS))('%s solo ve sus tabs', async (role, expected) => {
    await renderAs(role as Role);

    for (const title of TAB_TITLES) {
      if (expected.includes(title)) expect(tabButton(title)).toBeOnTheScreen();
      else expect(tabButton(title)).toBeNull();
    }
  });

  it('un mesero no puede navegar a una pantalla exclusiva del administrador', async () => {
    const { navigationRef } = await renderAs('mesero');
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await act(() => navigationRef.navigate('dashboard'));

    const root = navigationRef.getRootState()!;
    expect(root.routes[root.index].name).toBe('menu');
    expect(screen.queryByText('Cargando dashboard…')).toBeNull();
  });

  it('un administrador sí entra al dashboard', async () => {
    const { navigationRef } = await renderAs('admin');

    await act(() => navigationRef.navigate('reservations'));
    await act(() => navigationRef.navigate('dashboard'));

    expect(navigationRef.getCurrentRoute()?.name).toBe('dashboard');
    expect(screen.getByText('Cargando dashboard…')).toBeOnTheScreen();
  });

  it('si cambia el rol en la sesión, se reconstruyen los tabs sin historial del rol anterior', async () => {
    const { deps, navigationRef } = await renderAs('admin');
    expect(tabButton('Dashboard')).toBeOnTheScreen();

    const cocina = makeSession();
    cocina.user.role = 'cocina';
    await act(() => deps.sessionStore.getState().setSession(cocina));

    expect(tabButton('Dashboard')).toBeNull();
    expect(navigationRef.getCurrentRoute()?.name).toBe('orders');
  });
});

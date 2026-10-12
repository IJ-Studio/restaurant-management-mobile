import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import type { Role } from '../../features/auth/domain/entities/User';
import { useSessionStore } from '../../features/auth/presentation/store/sessionStore';
import { RoleGuard } from '../RoleGuard';
import { canAccess, homeRouteFor, ROLE_TABS, type TabRoute } from '../roleRoutes';

describe('roleRoutes', () => {
  it('todos los roles tienen Perfil (cerrar sesión)', () => {
    (Object.keys(ROLE_TABS) as Role[]).forEach((role) => expect(canAccess(role, 'profile')).toBe(true));
  });

  it.each<[TabRoute, Role[]]>([
    ['dashboard', ['admin']],
    ['kitchen', ['cocina']],
    ['orders', ['admin', 'cajero', 'mesero']],
    ['reservations', ['admin', 'cajero', 'mesero']],
    ['menu', ['admin', 'cajero', 'mesero']],
  ])('matriz de acceso: %s solo para %j', (route, allowed) => {
    (Object.keys(ROLE_TABS) as Role[]).forEach((role) => {
      expect(canAccess(role, route)).toBe(allowed.includes(role));
    });
  });

  it('sin sesión no hay acceso a nada', () => {
    expect(canAccess(null, 'profile')).toBe(false);
    expect(canAccess(undefined, 'menu')).toBe(false);
  });

  it('la pantalla de inicio es la primera tab del rol', () => {
    expect(homeRouteFor('mesero')).toBe('menu');
    expect(homeRouteFor('admin')).toBe('dashboard');
  });
});

describe('RoleGuard', () => {
  const Tab = createBottomTabNavigator();

  function renderAs(role: Role) {
    useSessionStore.setState({
      status: 'authenticated',
      session: { token: 't', user: { id: '1', name: 'A', lastname: 'B', email: 'a@b.mx', role } },
    });
    // Un navegador con una ruta de Admin registrada por error: el guard debe bloquearla.
    return render(
      <NavigationContainer>
        <Tab.Navigator initialRouteName="dashboard">
          <Tab.Screen name="menu">{() => <Text>Pantalla de menú</Text>}</Tab.Screen>
          <Tab.Screen name="dashboard">
            {() => (
              <RoleGuard route="dashboard">
                <Text>Datos del dashboard</Text>
              </RoleGuard>
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>,
    );
  }

  it('redirige a un rol sin permiso a su pantalla de inicio sin mostrar el contenido', async () => {
    await renderAs('mesero');
    expect(await screen.findByText('Pantalla de menú')).toBeOnTheScreen();
    expect(screen.queryByText('Datos del dashboard')).toBeNull();
  });

  it('deja pasar al rol con permiso', async () => {
    await renderAs('admin');
    expect(await screen.findByText('Datos del dashboard')).toBeOnTheScreen();
  });
});

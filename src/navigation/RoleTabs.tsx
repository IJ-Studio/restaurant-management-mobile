import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ComponentType } from 'react';

import type { Role } from '../features/auth/domain/entities/User';
import { DashboardScreen } from '../features/admin/presentation/screens/DashboardScreen';
import { ProfileScreen } from '../features/auth/presentation/screens/ProfileScreen';
import { MenuStack } from '../features/menu/presentation/navigation/MenuStack';
import { CurrentOrderScreen } from '../features/orders/presentation/screens/CurrentOrderScreen';
import { ReservationsStack } from '../features/reservations/presentation/navigation/ReservationsStack';
import { useNotificationPermission } from '../features/notifications/presentation/viewmodels/useNotificationPermission';
import { RoleGuard } from './RoleGuard';
import { ROLE_TABS, type TabRoute } from './roleRoutes';
import { ComingSoonScreen } from './screens/ComingSoonScreen';

const Tab = createBottomTabNavigator();

function comingSoon(title: string, story: string): ComponentType {
  const Screen = () => <ComingSoonScreen title={title} story={story} />;
  Screen.displayName = `ComingSoon(${title})`;
  return Screen;
}

const TABS: Record<TabRoute, { title: string; component: ComponentType }> = {
  dashboard: { title: 'Dashboard', component: DashboardScreen },
  orders: { title: 'Pedidos', component: CurrentOrderScreen },
  kitchen: { title: 'Cocina', component: comingSoon('Pedidos en cocina', 'HU-06') },
  reservations: { title: 'Reservaciones', component: ReservationsStack },
  menu: { title: 'Menú', component: MenuStack },
  profile: { title: 'Perfil', component: ProfileScreen },
};

function guarded(route: TabRoute): ComponentType {
  const { component: Screen } = TABS[route];
  const Guarded = () => (
    <RoleGuard route={route}>
      <Screen />
    </RoleGuard>
  );
  Guarded.displayName = `Guarded(${route})`;
  return Guarded;
}

const GUARDED = Object.fromEntries(
  (Object.keys(TABS) as TabRoute[]).map((route) => [route, guarded(route)]),
) as Record<TabRoute, ComponentType>;

/** Solo se registran las tabs del rol: las de otros roles no existen en su navegador. */
export function RoleTabs({ role }: { role: Role }) {
  // Al entrar con sesión se pide el permiso de notificaciones (una sola vez; HU-07).
  useNotificationPermission({ askOnMount: true });
  return (
    <Tab.Navigator>
      {ROLE_TABS[role].map((route) => (
        <Tab.Screen key={route} name={route} component={GUARDED[route]} options={{ title: TABS[route].title }} />
      ))}
    </Tab.Navigator>
  );
}

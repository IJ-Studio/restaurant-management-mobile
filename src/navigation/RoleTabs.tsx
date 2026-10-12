import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ComponentType } from 'react';

import type { Role } from '../features/auth/domain/entities/User';
import { ProfileScreen } from '../features/auth/presentation/screens/ProfileScreen';
import { MenuStack } from '../features/menu/presentation/navigation/MenuStack';
import { ReservationsStack } from '../features/reservations/presentation/navigation/ReservationsStack';
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
  dashboard: { title: 'Dashboard', component: comingSoon('Dashboard', 'HU-08') },
  orders: { title: 'Pedidos', component: comingSoon('Pedidos', 'HU-05') },
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
  return (
    <Tab.Navigator>
      {ROLE_TABS[role].map((route) => (
        <Tab.Screen key={route} name={route} component={GUARDED[route]} options={{ title: TABS[route].title }} />
      ))}
    </Tab.Navigator>
  );
}

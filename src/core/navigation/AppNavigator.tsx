import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  type LinkingOptions,
  type NavigationContainerRef,
} from '@react-navigation/native';
import { useMemo, type Ref } from 'react';

import { sectionsFor, type Section } from '../../features/auth/domain/entities/permissions';
import { RequireSection } from '../../features/auth/presentation/components/RequireSection';
import { useSession } from '../../features/auth/presentation/viewmodels/useSession';
import { orderIdFromNotification } from '../../features/notifications/domain/entities/notificationTarget';
import { NotificationPermissionPrompt } from '../../features/notifications/presentation/components/NotificationPermissionPrompt';
import { useDependencies } from '../di/DependenciesProvider';
import { navigationTheme, tabScreenOptions } from './navigationTheme';
import { SECTION_CONFIG } from './sections';

export type TabParamList = Record<Section, undefined>;

/** Esquema interno para convertir un aviso en una ruta; la app no registra enlaces externos. */
const NOTIFICATION_URL = 'elquijote://';

const Tab = createBottomTabNavigator<TabParamList>();

// Componentes estables por sección (no se recrean en cada render).
const GUARDED_SCREENS = Object.fromEntries(
  (Object.keys(SECTION_CONFIG) as Section[]).map((section) => {
    const Screen = SECTION_CONFIG[section].component;
    function Guarded() {
      return (
        <RequireSection section={section}>
          <Screen />
        </RequireSection>
      );
    }
    return [section, Guarded];
  }),
) as Record<Section, () => React.JSX.Element>;

interface Props {
  navigationRef?: Ref<NavigationContainerRef<TabParamList>>;
}

/** Tabs según el rol de la sesión: solo se registran las rutas que el rol puede ver. */
export function AppNavigator({ navigationRef }: Props) {
  const role = useSession((state) => state.session?.user.role);
  const sections = sectionsFor(role);
  const { pushNotifications } = useDependencies();
  // Tocar un aviso de pedido abre ese pedido (HU-07). La lista queda debajo para poder volver.
  const linking = useMemo<LinkingOptions<TabParamList>>(
    () => ({
      prefixes: [NOTIFICATION_URL],
      // Las pantallas internas de cada pestaña no están en `TabParamList`: la ruta se declara sin ese tipo.
      config: {
        screens: {
          orders: { initialRouteName: 'OrdersList', screens: { OrderDetail: 'pedidos/:orderId' } },
        },
      } as unknown as LinkingOptions<TabParamList>['config'],
      getInitialURL: () => null,
      subscribe: (open) =>
        pushNotifications.onNotificationOpened((notification) => {
          const orderId = orderIdFromNotification(notification);
          if (!orderId) return;
          const { place } = notification.data;
          const query = `place=${encodeURIComponent(typeof place === 'string' ? place : 'Pedido')}`;
          open(`${NOTIFICATION_URL}pedidos/${orderId}?${query}`);
        }),
    }),
    [pushNotifications],
  );

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} linking={linking}>
      {/* Con sesión se explica para qué son los avisos antes de pedir el permiso del sistema. */}
      <NotificationPermissionPrompt />
      {/* key: si cambia el rol se reconstruye el navegador y no queda historial de otro rol. */}
      <Tab.Navigator key={role} screenOptions={tabScreenOptions}>
        {sections.map((section) => (
          <Tab.Screen
            key={section}
            name={section}
            component={GUARDED_SCREENS[section]}
            options={{
              title: SECTION_CONFIG[section].title,
              headerShown: SECTION_CONFIG[section].headerShown ?? true,
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons
                  name={focused ? SECTION_CONFIG[section].icon.active : SECTION_CONFIG[section].icon.inactive}
                  color={color}
                  size={size}
                />
              ),
            }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import type { Ref } from 'react';

import { sectionsFor, type Section } from '../../features/auth/domain/entities/permissions';
import { RequireSection } from '../../features/auth/presentation/components/RequireSection';
import { useSession } from '../../features/auth/presentation/viewmodels/useSession';
import { navigationTheme, tabScreenOptions } from './navigationTheme';
import { SECTION_CONFIG } from './sections';

export type TabParamList = Record<Section, undefined>;

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

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
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

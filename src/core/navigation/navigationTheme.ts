import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { DefaultTheme, type Theme } from '@react-navigation/native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { colors, fonts } from '../../shared/presentation/theme';

/**
 * Tema de React Navigation con la paleta y la tipografía de El Quijote. Con fuentes propias cada peso es
 * su propia familia, así que `fontWeight` queda en "normal" para que iOS no la sustituya.
 */
export const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.brandStrong,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.brand,
  },
  fonts: {
    regular: { fontFamily: fonts.regular, fontWeight: 'normal' },
    medium: { fontFamily: fonts.medium, fontWeight: 'normal' },
    bold: { fontFamily: fonts.bold, fontWeight: 'normal' },
    heavy: { fontFamily: fonts.bold, fontWeight: 'normal' },
  },
};

const headerTitleStyle = { fontFamily: fonts.bold, fontSize: 19, color: colors.text };

/** Encabezado de los stacks (Menú, Reservaciones, Pedidos). */
export const stackScreenOptions: NativeStackNavigationOptions = {
  headerTitleStyle,
  headerTintColor: colors.brandStrong,
  headerBackButtonDisplayMode: 'minimal',
  headerStyle: { backgroundColor: colors.surface },
  contentStyle: { backgroundColor: colors.background },
};

/** Barra de pestañas y encabezado de las pestañas sin stack (Dashboard, Cobros, Perfil). */
export const tabScreenOptions: BottomTabNavigationOptions = {
  headerTitleAlign: 'center',
  headerTitleStyle,
  headerStyle: { backgroundColor: colors.surface },
  tabBarActiveTintColor: colors.brandStrong,
  tabBarInactiveTintColor: colors.textSecondary,
  tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 12 },
  tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
};

import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ComponentType } from 'react';
import { Platform } from 'react-native';

import { AdminNavigator } from '../../features/admin/presentation/navigation/AdminNavigator';
import type { Section } from '../../features/auth/domain/entities/permissions';
import { MenuNavigator } from '../../features/menu/presentation/navigation/MenuNavigator';
import { CheckoutNavigator } from '../../features/orders/presentation/navigation/CheckoutNavigator';
import { OrdersNavigator } from '../../features/orders/presentation/navigation/OrdersNavigator';
import { ProfileNavigator } from '../../features/profile/presentation/navigation/ProfileNavigator';
import { ReservationsNavigator } from '../../features/reservations/presentation/navigation/ReservationsNavigator';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface SectionConfig {
  title: string;
  /** Texto corto de la pestaña cuando el título no cabe; el título sigue siendo el nombre accesible. */
  tabLabel?: string;
  component: ComponentType;
  headerShown?: boolean;
  /** Ícono de la pestaña: relleno cuando está activa, de contorno cuando no. */
  icon: { active: IconName; inactive: IconName };
}

/** Pantalla de cada sección. */
export const SECTION_CONFIG: Record<Section, SectionConfig> = {
  dashboard: {
    title: 'Dashboard',
    component: AdminNavigator,
    headerShown: false,
    icon: { active: 'grid', inactive: 'grid-outline' },
  },
  // Menú, Pedidos, Reservaciones, Cobros y Perfil tienen su propio stack con su encabezado.
  menu: {
    title: 'Menú',
    component: MenuNavigator,
    headerShown: false,
    icon: { active: 'restaurant', inactive: 'restaurant-outline' },
  },
  orders: {
    title: 'Pedidos',
    component: OrdersNavigator,
    headerShown: false,
    icon: { active: 'receipt', inactive: 'receipt-outline' },
  },
  reservations: {
    title: 'Reservaciones',
    tabLabel: 'Reservas',
    component: ReservationsNavigator,
    headerShown: false,
    icon: { active: 'calendar', inactive: 'calendar-outline' },
  },
  checkout: {
    title: 'Cobros',
    component: CheckoutNavigator,
    headerShown: false,
    icon: { active: 'card', inactive: 'card-outline' },
  },
  profile: {
    title: 'Perfil',
    component: ProfileNavigator,
    headerShown: false,
    icon: { active: 'person', inactive: 'person-outline' },
  },
};

/**
 * Pestaña con texto corto («Reservas»): el nombre accesible sigue siendo el título completo, con el
 * mismo formato que React Navigation arma en iOS, para que lectores de pantalla y flujos lo encuentren.
 */
export function tabLabelOptions({ title, tabLabel }: SectionConfig, index: number, count: number) {
  if (!tabLabel) return {};
  return {
    tabBarLabel: tabLabel,
    tabBarAccessibilityLabel: Platform.OS === 'ios' ? `${title}, tab, ${index + 1} of ${count}` : title,
  };
}

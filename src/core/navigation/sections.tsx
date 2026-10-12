import type { ComponentType } from 'react';

import type { Section } from '../../features/auth/domain/entities/permissions';
import { ProfileScreen } from '../../features/auth/presentation/screens/ProfileScreen';
import { MenuNavigator } from '../../features/menu/presentation/navigation/MenuNavigator';
import { PlaceholderScreen } from '../../shared/presentation/components/PlaceholderScreen';

interface SectionConfig {
  title: string;
  component: ComponentType;
  headerShown?: boolean;
}

const placeholder = (title: string, description: string) =>
  function Placeholder() {
    return <PlaceholderScreen title={title} description={description} />;
  };

/** Pantalla de cada sección. Las provisionales se reemplazan en su historia. */
export const SECTION_CONFIG: Record<Section, SectionConfig> = {
  dashboard: { title: 'Dashboard', component: placeholder('Dashboard', 'Indicadores del día (HU-08).') },
  // La sección tiene su propio stack (lista → detalle) con su encabezado.
  menu: { title: 'Menú', component: MenuNavigator, headerShown: false },
  orders: { title: 'Pedidos', component: placeholder('Pedidos', 'Pedidos activos en tiempo real (HU-06).') },
  reservations: {
    title: 'Reservaciones',
    component: placeholder('Reservaciones', 'Registro de reservaciones (HU-04).'),
  },
  checkout: { title: 'Cobros', component: placeholder('Cobros', 'Cobro de cuentas con Stripe (HU-05).') },
  profile: { title: 'Perfil', component: ProfileScreen },
};

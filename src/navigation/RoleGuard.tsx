import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useEffect, type ReactNode } from 'react';

import { useSessionStore } from '../features/auth/presentation/store/sessionStore';
import { canAccess, homeRouteFor, type TabRoute } from './roleRoutes';

interface Props {
  route: TabRoute;
  children: ReactNode;
}

/**
 * Segunda barrera (además de registrar solo las tabs del rol): si por un deep link o un
 * cambio de rol se llega a una ruta no permitida, no se renderiza y se regresa al inicio del rol.
 * La autorización real la hace el API con el rol del JWT.
 */
export function RoleGuard({ route, children }: Props) {
  const role = useSessionStore((state) => state.session?.user.role);
  const navigation = useNavigation<NavigationProp<Record<TabRoute, undefined>>>();
  const allowed = canAccess(role, route);

  useEffect(() => {
    if (!allowed && role) navigation.navigate(homeRouteFor(role));
  }, [allowed, role, navigation]);

  return allowed ? <>{children}</> : null;
}

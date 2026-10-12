import type { Role } from '../features/auth/domain/entities/User';

export type TabRoute = 'dashboard' | 'menu' | 'reservations' | 'orders' | 'kitchen' | 'profile';

/**
 * Qué tabs ve cada rol, en orden. Un mapeo simple basta para 4 roles fijos (HU-02).
 * Cada historia reemplaza su pantalla "Próximamente" en `RoleTabs`.
 */
export const ROLE_TABS: Record<Role, readonly TabRoute[]> = {
  admin: ['dashboard', 'orders', 'reservations', 'menu', 'profile'],
  cajero: ['orders', 'reservations', 'menu', 'profile'],
  mesero: ['menu', 'orders', 'reservations', 'profile'],
  cocina: ['kitchen', 'profile'],
};

export function canAccess(role: Role | null | undefined, route: TabRoute): boolean {
  return !!role && ROLE_TABS[role].includes(route);
}

export function homeRouteFor(role: Role): TabRoute {
  return ROLE_TABS[role][0];
}

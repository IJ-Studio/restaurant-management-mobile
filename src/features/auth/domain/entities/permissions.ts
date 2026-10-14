import type { Role } from './Role';

export type Section = 'dashboard' | 'menu' | 'orders' | 'reservations' | 'checkout' | 'profile';

/**
 * Qué secciones ve cada rol (HU-02). Un objeto de mapeo basta con 4 roles fijos.
 * Es solo la vista: el API vuelve a validar el rol del JWT en cada endpoint.
 */
export const SECTIONS_BY_ROLE: Readonly<Record<Role, readonly Section[]>> = {
  admin: ['dashboard', 'orders', 'reservations', 'menu', 'profile'],
  mesero: ['menu', 'orders', 'reservations', 'profile'],
  cajero: ['checkout', 'orders', 'profile'],
  cocina: ['orders', 'profile'],
  cliente: [],
};

export function sectionsFor(role: Role | undefined): readonly Section[] {
  return role ? (SECTIONS_BY_ROLE[role] ?? []) : [];
}

export function canAccess(role: Role | undefined, section: Section): boolean {
  return sectionsFor(role).includes(section);
}

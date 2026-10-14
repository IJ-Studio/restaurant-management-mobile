export type Role = 'admin' | 'cajero' | 'mesero' | 'cocina' | 'cliente';

/** Roles del personal: los únicos que pueden usar la app (no hay registro público). */
export const STAFF_ROLES: readonly Role[] = ['admin', 'cajero', 'mesero', 'cocina'];

export function isStaff(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

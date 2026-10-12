/** Roles del personal que pueden usar la app (el rol 5, cliente, no entra). */
export type Role = 'admin' | 'cajero' | 'mesero' | 'cocina';

const ROLE_BY_ID: Record<number, Role> = {
  1: 'admin',
  2: 'cajero',
  3: 'mesero',
  4: 'cocina',
};

/** Devuelve el rol del personal o `null` si el `roleId` no corresponde a la app móvil. */
export function roleFromId(roleId: number): Role | null {
  return ROLE_BY_ID[roleId] ?? null;
}

export interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  role: Role;
}

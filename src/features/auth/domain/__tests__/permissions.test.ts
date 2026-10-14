import { canAccess, SECTIONS_BY_ROLE, sectionsFor, type Section } from '../entities/permissions';
import type { Role } from '../entities/Role';

const ALL: Section[] = ['dashboard', 'menu', 'orders', 'reservations', 'checkout', 'profile'];

// Matriz rol × sección: queda como prueba de regresión del control de acceso de la app.
const MATRIX: Record<Role, Section[]> = {
  admin: ['dashboard', 'menu', 'orders', 'reservations', 'profile'],
  mesero: ['menu', 'orders', 'reservations', 'profile'],
  cajero: ['orders', 'checkout', 'profile'],
  cocina: ['orders', 'profile'],
  cliente: [],
};

describe('permisos por rol', () => {
  describe.each(Object.entries(MATRIX) as [Role, Section[]][])('%s', (role, allowed) => {
    it.each(ALL)('sección %s', (section) => {
      expect(canAccess(role, section)).toBe(allowed.includes(section));
    });
  });

  it('solo el administrador ve el dashboard', () => {
    const withDashboard = Object.entries(SECTIONS_BY_ROLE).filter(([, sections]) =>
      sections.includes('dashboard'),
    );
    expect(withDashboard.map(([role]) => role)).toEqual(['admin']);
  });

  it('sin rol (sin sesión o rol alterado) no hay acceso a nada', () => {
    expect(sectionsFor(undefined)).toEqual([]);
    expect(canAccess('superadmin' as Role, 'dashboard')).toBe(false);
  });
});

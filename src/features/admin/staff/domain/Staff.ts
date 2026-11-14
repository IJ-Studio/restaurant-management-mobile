/** Personal en administración (Fase 2): las mismas reglas, mensajes y llamadas que la web (Usuarios). */
export const ROLE_LABELS: Record<number, string> = {
  1: 'Administrador',
  2: 'Cajero',
  3: 'Mesero',
  4: 'Cocina',
  5: 'Cliente',
};
/** Roles que el API deja crear o asignar (el de administrador no). */
export const CREATABLE_ROLES = [2, 3, 4, 5] as const;

export interface StaffMember {
  id: number;
  name: string;
  lastname: string;
  email: string;
  phone: string | null;
  roleId: number;
  active: boolean;
}

export interface StaffInput {
  name: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
  roleId: number;
}

export interface StaffRepository {
  list(): Promise<StaffMember[]>;
  create(input: StaffInput): Promise<void>;
  update(id: number, changes: { name: string; lastname: string; phone: string }): Promise<void>;
  changeRole(id: number, roleId: number): Promise<void>;
  deactivate(id: number): Promise<void>;
  reactivate(id: number): Promise<void>;
}

export type StaffErrors = Partial<Record<keyof StaffInput, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 10 dígitos de México (con o sin +52); devuelve `+52XXXXXXXXXX` o `null`. */
export function phoneWithCountryCode(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  const local = value.trim().startsWith('+52') && digits.length === 12 ? digits.slice(2) : digits;
  return /^\d{10}$/.test(local) ? `+52${local}` : null;
}

/** Mismos mensajes que `esquemaUsuarioNuevo` / `esquemaUsuarioEdicion` de la web. */
export function validateStaff(input: StaffInput, editing: { roleId: number } | null): StaffErrors {
  const e: StaffErrors = {};
  if (!input.name.trim()) e.name = 'Escribe el nombre.';
  if (!input.lastname.trim()) e.lastname = 'Escribe los apellidos.';
  if (!phoneWithCountryCode(input.phone)) e.phone = 'Debe contener 10 dígitos.';
  const roles: readonly number[] = editing?.roleId === 1 ? [1] : CREATABLE_ROLES;
  if (!roles.includes(input.roleId)) e.roleId = 'Elige un rol.';
  if (!editing) {
    if (!input.email.trim()) e.email = 'Escribe el correo.';
    else if (!EMAIL.test(input.email.trim())) e.email = 'Ingresa un correo electrónico válido.';
    if (input.password.length < 8) e.password = 'Mínimo 8 caracteres.';
  }
  return e;
}

export class StaffValidationError extends Error {
  constructor(readonly errors: StaffErrors) {
    super(Object.values(errors)[0] ?? 'Revisa los datos.');
  }
}

/** Alta o edición. En la edición, el correo y la contraseña no cambian (el API no lo admite aquí). */
export class SaveStaffUseCase {
  constructor(private readonly repository: StaffRepository) {}

  async execute(input: StaffInput, original?: StaffMember): Promise<void> {
    const errors = validateStaff(input, original ?? null);
    if (Object.keys(errors).length) throw new StaffValidationError(errors);
    const phone = phoneWithCountryCode(input.phone) as string;
    const name = input.name.trim();
    const lastname = input.lastname.trim();
    if (!original) {
      return this.repository.create({ ...input, name, lastname, phone, email: input.email.trim() });
    }
    await this.repository.update(original.id, { name, lastname, phone });
    if (input.roleId !== original.roleId) await this.repository.changeRole(original.id, input.roleId);
  }
}

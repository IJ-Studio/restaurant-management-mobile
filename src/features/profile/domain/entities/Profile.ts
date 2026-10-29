/** Datos del usuario que se pueden ver y editar desde la app (GET/PATCH /users/:id). */
export interface UserProfile {
  id: string;
  name: string;
  lastname: string;
  email: string;
  /** Formato internacional E.164 ("+527711234567"). */
  phone?: string;
}

export interface ProfileChanges {
  name: string;
  lastname: string;
  /** Lo que escribió el usuario; se normaliza antes de mandarlo. */
  phone: string;
}

export type ProfileErrors = Partial<Record<keyof ProfileChanges, string>>;

const NAME_MAX = 50;
const E164 = /^\+[1-9]\d{9,14}$/;

/**
 * Convierte lo que escribe el usuario al formato que exige el API: sin espacios ni guiones,
 * y con +52 si escribió solo los 10 dígitos de un número de México. Vacío → undefined.
 */
export function normalizePhone(text: string): string | undefined {
  const compact = text.replace(/[\s().-]/g, '');
  if (!compact) return undefined;
  if (/^\d{10}$/.test(compact)) return `+52${compact}`;
  if (/^52\d{10}$/.test(compact)) return `+${compact}`;
  return compact;
}

export function validateProfile(changes: ProfileChanges): ProfileErrors {
  const errors: ProfileErrors = {};
  const name = changes.name.trim();
  const lastname = changes.lastname.trim();
  if (!name || name.length > NAME_MAX) errors.name = `Escribe tu nombre (máximo ${NAME_MAX} caracteres).`;
  if (!lastname || lastname.length > NAME_MAX) {
    errors.lastname = `Escribe tu apellido (máximo ${NAME_MAX} caracteres).`;
  }
  const phone = normalizePhone(changes.phone);
  if (phone && !E164.test(phone)) {
    errors.phone = 'Escribe 10 dígitos o el número con lada internacional (+52…).';
  }
  return errors;
}

export interface PasswordChange {
  current: string;
  next: string;
  confirm: string;
}

export type PasswordErrors = Partial<Record<keyof PasswordChange, string>>;

/** Requisitos de la contraseña nueva (los mismos del API), para mostrarlos como lista. */
export const PASSWORD_RULES: { label: string; test: (password: string) => boolean }[] = [
  { label: 'De 8 a 64 caracteres', test: (p) => p.length >= 8 && p.length <= 64 },
  { label: 'Una minúscula', test: (p) => /[a-z]/.test(p) },
  { label: 'Una mayúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Un número', test: (p) => /\d/.test(p) },
  { label: 'Un símbolo (#, $, !…)', test: (p) => /[^A-Za-z0-9\s]/.test(p) },
];

export function validatePasswordChange(change: PasswordChange): PasswordErrors {
  const errors: PasswordErrors = {};
  if (!change.current) errors.current = 'Escribe tu contraseña actual.';
  if (!PASSWORD_RULES.every((rule) => rule.test(change.next))) {
    errors.next = 'La contraseña nueva no cumple todos los requisitos.';
  } else if (change.next === change.current) {
    errors.next = 'La contraseña nueva debe ser distinta de la actual.';
  }
  if (change.confirm !== change.next) errors.confirm = 'Las contraseñas no coinciden.';
  return errors;
}

export const hasErrors = (errors: object) => Object.values(errors).some(Boolean);

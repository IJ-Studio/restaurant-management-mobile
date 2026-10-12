export interface Credentials {
  email: string;
  password: string;
}

export type CredentialsErrors = Partial<Record<keyof Credentials, string>>;

// Mismas reglas que SignInDto del API: email válido (≤255) y contraseña de al menos 8 caracteres.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export function validateCredentials({ email, password }: Credentials): CredentialsErrors {
  const errors: CredentialsErrors = {};
  const trimmed = email.trim();

  if (!trimmed) errors.email = 'Ingresa tu correo.';
  else if (trimmed.length > 255 || !EMAIL.test(trimmed)) errors.email = 'Ingresa un correo válido.';

  if (!password) errors.password = 'Ingresa tu contraseña.';
  else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña tiene al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  return errors;
}

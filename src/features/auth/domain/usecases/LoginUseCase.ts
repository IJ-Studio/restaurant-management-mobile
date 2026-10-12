import { AppError } from '../../../../core/errors/AppError';
import type { Session } from '../entities/Session';
import type { AuthRepository, Credentials } from '../repositories/AuthRepository';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

/** Mensaje único para credenciales inválidas: no revela si el correo existe. */
export const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos.';

export function validateCredentials({ email, password }: Credentials): string | null {
  if (!email.trim() || !password) return 'Ingresa tu correo y tu contraseña.';
  if (!EMAIL.test(email.trim())) return 'Ingresa un correo válido.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
}

export class LoginUseCase {
  constructor(private readonly repository: AuthRepository) {}

  async execute(credentials: Credentials): Promise<Session> {
    const normalized = { email: credentials.email.trim().toLowerCase(), password: credentials.password };
    const invalid = validateCredentials(normalized);
    if (invalid) throw new AppError('validation', invalid);

    try {
      return await this.repository.signIn(normalized);
    } catch (error) {
      // El API responde 400 o 401 con mensajes distintos para correo y contraseña:
      // la app muestra siempre el mismo mensaje (OWASP API2).
      if (error instanceof AppError && (error.kind === 'unauthorized' || error.kind === 'validation')) {
        throw new AppError('unauthorized', INVALID_CREDENTIALS, error.status);
      }
      if (error instanceof AppError && error.kind === 'rate-limit') {
        throw new AppError('rate-limit', 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.', error.status);
      }
      throw error;
    }
  }
}

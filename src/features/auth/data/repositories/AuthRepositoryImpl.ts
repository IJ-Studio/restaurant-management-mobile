import { AppError } from '../../../../core/errors/AppError';
import type { Credentials } from '../../domain/entities/credentials';
import type { Session } from '../../domain/entities/Session';
import type { AuthRepository } from '../../domain/repositories/AuthRepository';
import type { AuthRemoteDataSource } from '../datasources/AuthRemoteDataSource';
import { toSession } from '../mappers/sessionMapper';

// El API distingue "Correo inválido" de "Contraseña inválida"; la app no revela cuál falló.
const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos.';
const TOO_MANY_ATTEMPTS = 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly remote: AuthRemoteDataSource) {}

  async signIn({ email, password }: Credentials): Promise<Session> {
    try {
      return toSession(await this.remote.signIn(email, password));
    } catch (error) {
      throw toLoginError(error);
    }
  }

  signOut(): Promise<void> {
    return this.remote.signOut();
  }
}

function toLoginError(error: unknown): unknown {
  if (!(error instanceof AppError)) return error;
  if (error.kind === 'validation' || error.kind === 'unauthorized') {
    return new AppError('unauthorized', INVALID_CREDENTIALS, error.status);
  }
  if (error.kind === 'rate-limit') return new AppError('rate-limit', TOO_MANY_ATTEMPTS, error.status);
  return error;
}

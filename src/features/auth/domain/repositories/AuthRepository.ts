import type { Credentials } from '../entities/credentials';
import type { Session } from '../entities/Session';

export interface AuthRepository {
  /** Lanza AppError 'unauthorized' con un mensaje genérico si las credenciales no son válidas. */
  signIn(credentials: Credentials): Promise<Session>;
  /** Revoca el token en el servidor. */
  signOut(): Promise<void>;
}

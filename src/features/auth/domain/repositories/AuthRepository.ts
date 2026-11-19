import type { Credentials } from '../entities/credentials';
import type { Session } from '../entities/Session';

export interface AuthRepository {
  /** Lanza AppError 'unauthorized' con un mensaje genérico si las credenciales no son válidas. */
  signIn(credentials: Credentials): Promise<Session>;
  /** Cambia el token de refresco (de un solo uso) por una sesión nueva. */
  refresh(refreshToken: string): Promise<Session>;
  /** Revoca en el servidor la sesión de este dispositivo y su token de refresco. */
  signOut(refreshToken?: string): Promise<void>;
}

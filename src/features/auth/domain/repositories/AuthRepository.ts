import type { Session } from '../entities/Session';

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthRepository {
  /** Autentica contra el API y guarda la sesión en el almacenamiento seguro. */
  signIn(credentials: Credentials): Promise<Session>;
  /** Revoca el token en el API (si se puede) y borra la sesión guardada. */
  signOut(): Promise<void>;
  /** Sesión guardada en el dispositivo, o `null` si no hay. */
  getStoredSession(): Promise<Session | null>;
  clearStoredSession(): Promise<void>;
}

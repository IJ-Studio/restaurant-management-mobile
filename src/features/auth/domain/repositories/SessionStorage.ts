import type { Session } from '../entities/Session';

/** Almacenamiento seguro de la sesión en el dispositivo (nunca AsyncStorage). */
export interface SessionStorage {
  save(session: Session): Promise<void>;
  load(): Promise<Session | null>;
  clear(): Promise<void>;
}

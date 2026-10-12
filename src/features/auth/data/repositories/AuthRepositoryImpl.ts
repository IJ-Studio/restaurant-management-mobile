import type { Session } from '../../domain/entities/Session';
import type { AuthRepository, Credentials } from '../../domain/repositories/AuthRepository';
import type { AuthRemoteDataSource } from '../datasources/AuthRemoteDataSource';
import { toSession } from '../mappers/sessionMapper';
import type { SessionStorage } from '../storage/SessionStorage';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(
    private readonly remote: AuthRemoteDataSource,
    private readonly storage: SessionStorage,
  ) {}

  async signIn(credentials: Credentials): Promise<Session> {
    const session = toSession(await this.remote.signIn(credentials));
    await this.storage.save(session);
    return session;
  }

  async signOut(): Promise<void> {
    try {
      await this.remote.signOut();
    } catch {
      // Sin red o con el token ya vencido, la sesión local se borra igual.
    } finally {
      await this.storage.clear();
    }
  }

  getStoredSession(): Promise<Session | null> {
    return this.storage.load();
  }

  clearStoredSession(): Promise<void> {
    return this.storage.clear();
  }
}

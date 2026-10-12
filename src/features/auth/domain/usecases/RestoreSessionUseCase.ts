import type { Session } from '../entities/Session';
import type { SessionStorage } from '../repositories/SessionStorage';

/** Hidrata la sesión guardada al abrir la app; descarta la que ya venció. */
export class RestoreSessionUseCase {
  constructor(
    private readonly storage: SessionStorage,
    private readonly now: () => number = Date.now,
  ) {}

  async execute(): Promise<Session | null> {
    const session = await this.storage.load();
    if (!session) return null;

    if (session.expiresAt <= this.now()) {
      await this.storage.clear();
      return null;
    }
    return session;
  }
}

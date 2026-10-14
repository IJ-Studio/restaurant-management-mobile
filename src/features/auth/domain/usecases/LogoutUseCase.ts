import type { AuthRepository } from '../repositories/AuthRepository';
import type { SessionStorage } from '../repositories/SessionStorage';

export class LogoutUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly storage: SessionStorage,
  ) {}

  /** La sesión local se borra aunque el servidor no responda (sin red, token ya vencido). */
  async execute(): Promise<void> {
    try {
      await this.repository.signOut();
    } catch {
      // Si el servidor no revoca el token, este vence solo (JWT_ACCESS_TOKEN_TTL).
    } finally {
      await this.storage.clear();
    }
  }
}

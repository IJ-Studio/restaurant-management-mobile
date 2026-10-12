import type { AuthRepository } from '../repositories/AuthRepository';

export class LogoutUseCase {
  constructor(private readonly repository: AuthRepository) {}

  /**
   * `revoke: false` solo borra la sesión local: se usa cuando el API ya rechazó el token (401)
   * y no tiene caso pedirle que lo revoque.
   */
  execute({ revoke = true }: { revoke?: boolean } = {}): Promise<void> {
    return revoke ? this.repository.signOut() : this.repository.clearStoredSession();
  }
}

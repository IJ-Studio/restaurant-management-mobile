import { isRetryable } from '../../../../core/errors/AppError';
import type { Session } from '../entities/Session';
import type { AuthRepository } from '../repositories/AuthRepository';
import type { SessionStorage } from '../repositories/SessionStorage';

/**
 * Renueva la sesión cuando el API rechaza el token de acceso (venció, o el servidor se reinició y
 * perdió las sesiones), para que el personal no tenga que escribir su contraseña a mitad del servicio.
 */
export class RefreshSessionUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly storage: SessionStorage,
  ) {}

  /**
   * Devuelve la sesión nueva, ya guardada, o `null` si el API no acepta el refresco (hay que
   * iniciar sesión). Si falla por red o por el servidor, lanza: la sesión se conserva para reintentar.
   */
  async execute(current: Session | null): Promise<Session | null> {
    if (!current?.refreshToken) return null;
    try {
      const session = await this.repository.refresh(current.refreshToken);
      await this.storage.save(session);
      return session;
    } catch (error) {
      if (isRetryable(error)) throw error;
      return null;
    }
  }
}

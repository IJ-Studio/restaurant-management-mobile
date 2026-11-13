import { AppError } from '../../../../core/errors/AppError';
import type { SessionStorage } from '../../../auth/domain/repositories/SessionStorage';
import type { PrivacyRepository } from '../repositories/PrivacyRepository';

export const PASSWORD_REQUIRED = 'Escribe tu contraseña para confirmar.';

/** Cancelación (ARCO): elimina la cuenta en el servidor y borra la sesión de este teléfono. */
export class DeleteAccountUseCase {
  constructor(
    private readonly repository: PrivacyRepository,
    private readonly storage: SessionStorage,
  ) {}

  async execute(password: string): Promise<void> {
    if (!password) throw new AppError('validation', PASSWORD_REQUIRED);
    await this.repository.deleteAccount(password);
    await this.storage.clear();
  }
}

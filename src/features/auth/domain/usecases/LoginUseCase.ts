import { AppError } from '../../../../core/errors/AppError';
import { validateCredentials, type Credentials } from '../entities/credentials';
import { isStaff } from '../entities/Role';
import type { Session } from '../entities/Session';
import type { AuthRepository } from '../repositories/AuthRepository';
import type { SessionStorage } from '../repositories/SessionStorage';

export class LoginUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly storage: SessionStorage,
  ) {}

  async execute(credentials: Credentials): Promise<Session> {
    const errors = validateCredentials(credentials);
    const firstError = errors.email ?? errors.password;
    if (firstError) throw new AppError('validation', firstError);

    const session = await this.repository.signIn({
      email: credentials.email.trim(),
      password: credentials.password,
    });

    if (!isStaff(session.user.role)) {
      throw new AppError('forbidden', 'Esta app es solo para el personal del restaurante.');
    }

    await this.storage.save(session);
    return session;
  }
}

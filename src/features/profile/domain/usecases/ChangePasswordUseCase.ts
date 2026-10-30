import { AppError } from '../../../../core/errors/AppError';
import { hasErrors, validatePasswordChange, type PasswordChange } from '../entities/Profile';
import type { ProfileRepository } from '../repositories/ProfileRepository';

export class ChangePasswordUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(userId: string, change: PasswordChange): Promise<void> {
    const errors = validatePasswordChange(change);
    if (hasErrors(errors)) {
      throw new AppError('validation', Object.values(errors).filter(Boolean).join('\n'));
    }
    await this.repository.changePassword(userId, change.current, change.next);
  }
}

import type { UserProfile } from '../entities/Profile';
import type { ProfileRepository } from '../repositories/ProfileRepository';

export class GetProfileUseCase {
  constructor(private readonly repository: ProfileRepository) {}

  execute(userId: string): Promise<UserProfile> {
    return this.repository.get(userId);
  }
}

import type { UserProfile } from '../entities/Profile';

export interface ProfileRepository {
  get(userId: string): Promise<UserProfile>;
  update(userId: string, changes: { name: string; lastname: string; phone?: string }): Promise<UserProfile>;
  changePassword(userId: string, current: string, next: string): Promise<void>;
}

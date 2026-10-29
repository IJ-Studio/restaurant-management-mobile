import { AppError } from '../../../../core/errors/AppError';
import type { Session } from '../../../auth/domain/entities/Session';
import type { SessionStorage } from '../../../auth/domain/repositories/SessionStorage';
import {
  hasErrors,
  normalizePhone,
  validateProfile,
  type ProfileChanges,
  type UserProfile,
} from '../entities/Profile';
import type { ProfileRepository } from '../repositories/ProfileRepository';

export interface UpdatedProfile {
  profile: UserProfile;
  /** Sesión con el nombre nuevo, ya guardada: el perfil se ve actualizado al instante. */
  session: Session;
}

export class UpdateProfileUseCase {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly sessionStorage: SessionStorage,
  ) {}

  async execute(session: Session, changes: ProfileChanges): Promise<UpdatedProfile> {
    const errors = validateProfile(changes);
    if (hasErrors(errors)) {
      throw new AppError('validation', Object.values(errors).filter(Boolean).join('\n'));
    }

    const profile = await this.repository.update(session.user.id, {
      name: changes.name.trim(),
      lastname: changes.lastname.trim(),
      phone: normalizePhone(changes.phone),
    });
    const updated: Session = {
      ...session,
      user: { ...session.user, name: profile.name, lastname: profile.lastname },
    };
    // Si el llavero falla, la sesión en memoria ya quedó actualizada; al reabrir se vuelve a leer.
    await this.sessionStorage.save(updated).catch(() => undefined);
    return { profile, session: updated };
  }
}

import { AppError } from '../../../../core/errors/AppError';
import type { UserProfile } from '../../domain/entities/Profile';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import type { ProfileRemoteDataSource, UserDto } from '../datasources/ProfileRemoteDataSource';

function toProfile(dto: UserDto): UserProfile {
  return {
    id: String(dto.id),
    name: dto.name,
    lastname: dto.lastname,
    email: dto.email,
    phone: dto.phone ?? undefined,
  };
}

/** Los mensajes de validación del DTO del API vienen en inglés; aquí se pasan a español. */
function translate(error: unknown): unknown {
  if (!(error instanceof AppError) || error.kind !== 'validation') return error;
  if (/phone/i.test(error.message)) {
    return new AppError('validation', 'El teléfono debe llevar lada internacional (+52…).', error.status);
  }
  if (/password too/i.test(error.message)) {
    return new AppError('validation', 'La contraseña nueva no cumple los requisitos.', error.status);
  }
  return error;
}

export class ProfileRepositoryImpl implements ProfileRepository {
  constructor(private readonly remote: ProfileRemoteDataSource) {}

  async get(userId: string): Promise<UserProfile> {
    return toProfile(await this.remote.get(userId));
  }

  async update(
    userId: string,
    changes: { name: string; lastname: string; phone?: string },
  ): Promise<UserProfile> {
    try {
      return toProfile(await this.remote.update(userId, changes));
    } catch (error) {
      throw translate(error);
    }
  }

  async changePassword(userId: string, current: string, next: string): Promise<void> {
    try {
      await this.remote.changePassword(userId, current, next);
    } catch (error) {
      throw translate(error);
    }
  }
}

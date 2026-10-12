import { AppError } from '../../../../core/errors/AppError';
import type { Session } from '../../domain/entities/Session';
import { roleFromId } from '../../domain/entities/User';
import type { SignInResponseDto } from '../dtos/SignInDto';

/** Toma solo los campos que la app necesita; descarta el resto (hash, intentos, etc.). */
export function toSession(dto: SignInResponseDto): Session {
  if (!dto?.accessToken || !dto.user) {
    throw new AppError('server', 'Respuesta de inicio de sesión inválida.');
  }
  const role = roleFromId(Number(dto.user.roleId));
  if (!role) {
    throw new AppError('forbidden', 'Esta app es solo para el personal del restaurante.', 403);
  }
  return {
    token: dto.accessToken,
    user: {
      id: String(dto.user.id),
      name: dto.user.name ?? '',
      lastname: dto.user.lastname ?? '',
      email: dto.user.email,
      role,
    },
  };
}

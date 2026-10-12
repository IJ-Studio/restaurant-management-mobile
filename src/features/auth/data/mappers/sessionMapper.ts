import { AppError } from '../../../../core/errors/AppError';
import type { Role } from '../../domain/entities/Role';
import type { Session } from '../../domain/entities/Session';
import type { SignInResponseDto } from '../dtos/SignInResponseDto';

// src/common/constants/roles.ts del API.
const ROLE_BY_ID: Record<number, Role> = { 1: 'admin', 2: 'cajero', 3: 'mesero', 4: 'cocina', 5: 'cliente' };

// JWT_ACCESS_TOKEN_TTL por defecto en el API.
const DEFAULT_TTL_MS = 60 * 60 * 1000;

/** Solo se copian los campos que usa la app: el hash de la contraseña y demás columnas nunca se guardan. */
export function toSession(dto: SignInResponseDto, now: number = Date.now()): Session {
  const role = ROLE_BY_ID[dto.user?.roleId];
  if (!dto.accessToken || !role) {
    throw new AppError('server', 'Respuesta de inicio de sesión inválida.');
  }

  return {
    token: dto.accessToken,
    expiresAt: jwtExpiration(dto.accessToken) ?? now + DEFAULT_TTL_MS,
    user: {
      id: String(dto.user.id),
      name: dto.user.name,
      lastname: dto.user.lastname,
      email: dto.user.email,
      role,
    },
  };
}

/** Lee `exp` del payload sin validar la firma: eso lo hace el API en cada petición. */
export function jwtExpiration(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: unknown };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

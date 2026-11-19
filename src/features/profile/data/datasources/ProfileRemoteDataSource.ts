import type { HttpClient } from '../../../../core/http/httpClient';

/** GET/PUT /profile (sin contraseña). */
export interface UserDto {
  id: number;
  name: string;
  lastname: string;
  email: string;
  phone: string | null;
  [extra: string]: unknown;
}

export class ProfileRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  /** Acceso (ARCO): el API toma al usuario del token. */
  get(): Promise<UserDto> {
    return this.http.get<UserDto>('profile');
  }

  /** Rectificación (ARCO). */
  update(body: { name: string; lastname: string; phone?: string }): Promise<UserDto> {
    return this.http.put<UserDto>('profile', body);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await this.http.patch(`users/${encodeURIComponent(userId)}/password`, { currentPassword, newPassword });
  }
}

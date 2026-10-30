import type { HttpClient } from '../../../../core/http/httpClient';

/** GET/PATCH /users/:id (sin contraseña). */
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

  get(userId: string): Promise<UserDto> {
    return this.http.get<UserDto>(`users/${encodeURIComponent(userId)}`);
  }

  update(userId: string, body: { name: string; lastname: string; phone?: string }): Promise<UserDto> {
    return this.http.patch<UserDto>(`users/${encodeURIComponent(userId)}`, body);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await this.http.patch(`users/${encodeURIComponent(userId)}/password`, { currentPassword, newPassword });
  }
}

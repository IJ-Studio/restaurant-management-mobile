import type { HttpClient } from '../../../../core/http/httpClient';
import type { SignInResponseDto } from '../dtos/SignInResponseDto';

export class AuthRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  signIn(email: string, password: string): Promise<SignInResponseDto> {
    return this.http.post<SignInResponseDto>('auth/sign-in', { email, password });
  }

  /** Va sin el token de acceso (ya venció) y no dispara otra renovación si el API lo rechaza. */
  refresh(refreshToken: string): Promise<SignInResponseDto> {
    return this.http.post<SignInResponseDto>('auth/refresh', { refreshToken }, { anonymous: true });
  }

  async signOut(refreshToken?: string): Promise<void> {
    await this.http.post('auth/sign-out', refreshToken ? { refreshToken } : undefined);
  }
}

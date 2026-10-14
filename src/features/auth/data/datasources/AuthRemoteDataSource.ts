import type { HttpClient } from '../../../../core/http/httpClient';
import type { SignInResponseDto } from '../dtos/SignInResponseDto';

export class AuthRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  signIn(email: string, password: string): Promise<SignInResponseDto> {
    return this.http.post<SignInResponseDto>('auth/sign-in', { email, password });
  }

  async signOut(): Promise<void> {
    await this.http.post('auth/sign-out');
  }
}

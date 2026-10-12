import type { HttpClient } from '../../../../core/http/httpClient';
import type { Credentials } from '../../domain/repositories/AuthRepository';
import type { SignInResponseDto } from '../dtos/SignInDto';

export class AuthRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  signIn(credentials: Credentials): Promise<SignInResponseDto> {
    return this.http.post<SignInResponseDto>('auth/sign-in', credentials);
  }

  signOut(): Promise<void> {
    return this.http.post<void>('auth/sign-out');
  }
}

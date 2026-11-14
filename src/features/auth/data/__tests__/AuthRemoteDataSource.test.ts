import type { HttpClient } from '../../../../core/http/httpClient';
import { AuthRemoteDataSource } from '../datasources/AuthRemoteDataSource';

describe('AuthRemoteDataSource', () => {
  it('usa los endpoints de auth del API', async () => {
    const http = { post: jest.fn().mockResolvedValue({}) } as unknown as jest.Mocked<HttpClient>;
    const remote = new AuthRemoteDataSource(http);

    await remote.signIn('ana@quijote.mx', 'Pass#2026');
    await remote.signOut();

    expect(http.post).toHaveBeenNthCalledWith(1, 'auth/sign-in', {
      email: 'ana@quijote.mx',
      password: 'Pass#2026',
    });
    expect(http.post).toHaveBeenNthCalledWith(2, 'auth/sign-out', undefined);
  });

  it('al cerrar sesión manda el token de refresco para que el API lo revoque', async () => {
    const http = { post: jest.fn().mockResolvedValue({}) } as unknown as jest.Mocked<HttpClient>;

    await new AuthRemoteDataSource(http).signOut('refresco-1');

    expect(http.post).toHaveBeenCalledWith('auth/sign-out', { refreshToken: 'refresco-1' });
  });

  it('el refresco va como petición anónima: sin el token vencido y sin renovarse a sí mismo', async () => {
    const http = { post: jest.fn().mockResolvedValue({}) } as unknown as jest.Mocked<HttpClient>;

    await new AuthRemoteDataSource(http).refresh('refresco-1');

    expect(http.post).toHaveBeenCalledWith(
      'auth/refresh',
      { refreshToken: 'refresco-1' },
      { anonymous: true },
    );
  });
});

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
    expect(http.post).toHaveBeenNthCalledWith(2, 'auth/sign-out');
  });
});

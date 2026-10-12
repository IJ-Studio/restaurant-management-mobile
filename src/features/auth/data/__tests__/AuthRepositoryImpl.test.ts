import { AppError } from '../../../../core/errors/AppError';
import type { HttpClient } from '../../../../core/http/httpClient';
import type { Session } from '../../domain/entities/Session';
import { AuthRemoteDataSource } from '../datasources/AuthRemoteDataSource';
import { AuthRepositoryImpl } from '../repositories/AuthRepositoryImpl';
import type { SessionStorage } from '../storage/SessionStorage';

function setup() {
  const http = { post: jest.fn() } as unknown as jest.Mocked<HttpClient>;
  const storage: jest.Mocked<SessionStorage> = {
    save: jest.fn().mockResolvedValue(undefined),
    load: jest.fn().mockResolvedValue(null),
    clear: jest.fn().mockResolvedValue(undefined),
  };
  const repository = new AuthRepositoryImpl(new AuthRemoteDataSource(http), storage);
  return { http, storage, repository };
}

describe('AuthRepositoryImpl', () => {
  it('inicia sesión contra POST /auth/sign-in y guarda la sesión', async () => {
    const { http, storage, repository } = setup();
    http.post.mockResolvedValue({
      accessToken: 'a.b.c',
      user: { id: 1, name: 'Ana', lastname: 'L', email: 'ana@resto.mx', roleId: 1 },
    });

    const session = await repository.signIn({ email: 'ana@resto.mx', password: 'secreto123' });

    expect(http.post).toHaveBeenCalledWith('auth/sign-in', { email: 'ana@resto.mx', password: 'secreto123' });
    expect(storage.save).toHaveBeenCalledWith(session);
    expect(session.user.role).toBe('admin');
  });

  it('no guarda nada si el login falla', async () => {
    const { http, storage, repository } = setup();
    http.post.mockRejectedValue(new AppError('unauthorized', 'x', 401));

    await expect(repository.signIn({ email: 'a@b.mx', password: '12345678' })).rejects.toBeInstanceOf(AppError);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('cierra sesión en el API y borra la sesión local', async () => {
    const { http, storage, repository } = setup();
    http.post.mockResolvedValue({ message: 'ok' });

    await repository.signOut();
    expect(http.post).toHaveBeenCalledWith('auth/sign-out');
    expect(storage.clear).toHaveBeenCalled();
  });

  it('borra la sesión local aunque el API no responda', async () => {
    const { http, storage, repository } = setup();
    http.post.mockRejectedValue(new AppError('network', 'sin red'));

    await expect(repository.signOut()).resolves.toBeUndefined();
    expect(storage.clear).toHaveBeenCalled();
  });

  it('lee y borra la sesión guardada', async () => {
    const { storage, repository } = setup();
    const stored = { token: 't' } as Session;
    storage.load.mockResolvedValue(stored);

    await expect(repository.getStoredSession()).resolves.toBe(stored);
    await repository.clearStoredSession();
    expect(storage.clear).toHaveBeenCalled();
  });
});

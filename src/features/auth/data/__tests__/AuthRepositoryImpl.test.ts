import { AppError } from '../../../../core/errors/AppError';
import type { AuthRemoteDataSource } from '../datasources/AuthRemoteDataSource';
import { AuthRepositoryImpl } from '../repositories/AuthRepositoryImpl';

function makeRemote(): jest.Mocked<AuthRemoteDataSource> {
  return {
    signIn: jest.fn(),
    signOut: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AuthRemoteDataSource>;
}

const credentials = { email: 'ana@quijote.mx', password: 'Pass#2026' };

describe('AuthRepositoryImpl', () => {
  it('devuelve la sesión mapeada', async () => {
    const remote = makeRemote();
    remote.signIn.mockResolvedValue({
      accessToken: 'a.b.c',
      user: { id: 1, name: 'Admin', lastname: 'Q', email: 'admin@quijote.mx', roleId: 1 },
    });

    const session = await new AuthRepositoryImpl(remote).signIn(credentials);
    expect(remote.signIn).toHaveBeenCalledWith('ana@quijote.mx', 'Pass#2026');
    expect(session.user.role).toBe('admin');
  });

  it.each([
    ['Correo inválido', 400],
    ['Contraseña inválida', 400],
    ['Unauthorized', 401],
  ])('no revela qué campo falló ("%s")', async (apiMessage, status) => {
    const remote = makeRemote();
    remote.signIn.mockRejectedValue(
      new AppError(status === 400 ? 'validation' : 'unauthorized', apiMessage, status),
    );

    await expect(new AuthRepositoryImpl(remote).signIn(credentials)).rejects.toMatchObject({
      kind: 'unauthorized',
      message: 'Correo o contraseña incorrectos.',
    });
  });

  it('avisa cuando el API limita los intentos (429)', async () => {
    const remote = makeRemote();
    remote.signIn.mockRejectedValue(new AppError('rate-limit', 'ThrottlerException', 429));

    await expect(new AuthRepositoryImpl(remote).signIn(credentials)).rejects.toMatchObject({
      kind: 'rate-limit',
      message: expect.stringContaining('Demasiados intentos'),
    });
  });

  it('deja pasar errores de red tal cual', async () => {
    const remote = makeRemote();
    const error = new AppError('network', 'No hay conexión con el servidor.');
    remote.signIn.mockRejectedValue(error);

    await expect(new AuthRepositoryImpl(remote).signIn(credentials)).rejects.toBe(error);
  });

  it('cierra sesión en el servidor', async () => {
    const remote = makeRemote();
    await new AuthRepositoryImpl(remote).signOut();
    expect(remote.signOut).toHaveBeenCalled();
  });
});

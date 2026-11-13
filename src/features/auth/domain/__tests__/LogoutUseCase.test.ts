import { AppError } from '../../../../core/errors/AppError';
import { LogoutUseCase } from '../usecases/LogoutUseCase';
import { makeRepository, makeSession, makeStorage } from '../../__fixtures__/auth';

describe('LogoutUseCase', () => {
  it('revoca el token en el servidor y borra la sesión local', async () => {
    const repository = makeRepository();
    const storage = makeStorage();

    await new LogoutUseCase(repository, storage).execute();
    expect(repository.signOut).toHaveBeenCalled();
    expect(storage.clear).toHaveBeenCalled();
  });

  it('manda al servidor el token de refresco guardado para que deje de servir', async () => {
    const repository = makeRepository();
    const storage = makeStorage(makeSession({ refreshToken: 'refresco-1' }));

    await new LogoutUseCase(repository, storage).execute();

    expect(repository.signOut).toHaveBeenCalledWith('refresco-1');
    expect(storage.clear).toHaveBeenCalled();
  });

  it('borra la sesión local aunque el servidor falle', async () => {
    const repository = makeRepository();
    repository.signOut.mockRejectedValue(new AppError('network', 'Sin conexión'));
    const storage = makeStorage();

    await expect(new LogoutUseCase(repository, storage).execute()).resolves.toBeUndefined();
    expect(storage.clear).toHaveBeenCalled();
  });
});

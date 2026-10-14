import { AppError } from '../../../../core/errors/AppError';
import { LogoutUseCase } from '../usecases/LogoutUseCase';
import { makeRepository, makeStorage } from '../../__fixtures__/auth';

describe('LogoutUseCase', () => {
  it('revoca el token en el servidor y borra la sesión local', async () => {
    const repository = makeRepository();
    const storage = makeStorage();

    await new LogoutUseCase(repository, storage).execute();
    expect(repository.signOut).toHaveBeenCalled();
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

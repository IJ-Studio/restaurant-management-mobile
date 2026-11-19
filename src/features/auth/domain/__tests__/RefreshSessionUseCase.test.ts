import { AppError } from '../../../../core/errors/AppError';
import { makeRepository, makeSession, makeStorage } from '../../__fixtures__/auth';
import { RefreshSessionUseCase } from '../usecases/RefreshSessionUseCase';

const current = makeSession({ token: 'viejo', refreshToken: 'refresco-1' });
const renewed = makeSession({ token: 'nuevo', refreshToken: 'refresco-2' });

describe('RefreshSessionUseCase', () => {
  it('cambia el refresco por una sesión nueva y la guarda', async () => {
    const repository = makeRepository();
    repository.refresh.mockResolvedValue(renewed);
    const storage = makeStorage(current);

    const result = await new RefreshSessionUseCase(repository, storage).execute(current);

    expect(repository.refresh).toHaveBeenCalledWith('refresco-1');
    expect(storage.save).toHaveBeenCalledWith(renewed);
    expect(result).toBe(renewed);
  });

  it('sin token de refresco (API anterior) no llama al servidor', async () => {
    const repository = makeRepository();

    const result = await new RefreshSessionUseCase(repository, makeStorage()).execute(makeSession());

    expect(result).toBeNull();
    expect(repository.refresh).not.toHaveBeenCalled();
  });

  it('si el API rechaza el refresco devuelve null y no guarda nada', async () => {
    const repository = makeRepository();
    repository.refresh.mockRejectedValue(new AppError('unauthorized', 'La sesión expiró.', 401));
    const storage = makeStorage(current);

    const result = await new RefreshSessionUseCase(repository, storage).execute(current);

    expect(result).toBeNull();
    expect(storage.save).not.toHaveBeenCalled();
  });

  it.each(['network', 'timeout', 'server'] as const)(
    'una falla pasajera (%s) se propaga: la sesión no se pierde por falta de red',
    async (kind) => {
      const repository = makeRepository();
      const failure = new AppError(kind, 'Sin conexión.');
      repository.refresh.mockRejectedValue(failure);
      const storage = makeStorage(current);

      await expect(new RefreshSessionUseCase(repository, storage).execute(current)).rejects.toBe(failure);
      expect(storage.clear).not.toHaveBeenCalled();
    },
  );
});

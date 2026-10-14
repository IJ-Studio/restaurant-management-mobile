import { RestoreSessionUseCase } from '../usecases/RestoreSessionUseCase';
import { makeSession, makeStorage } from '../../__fixtures__/auth';

const NOW = 1_800_000_000_000;

describe('RestoreSessionUseCase', () => {
  it('devuelve null si no hay sesión guardada', async () => {
    await expect(new RestoreSessionUseCase(makeStorage(null), () => NOW).execute()).resolves.toBeNull();
  });

  it('devuelve la sesión guardada si sigue vigente', async () => {
    const session = makeSession({ expiresAt: NOW + 1000 });
    await expect(new RestoreSessionUseCase(makeStorage(session), () => NOW).execute()).resolves.toBe(session);
  });

  it('descarta y borra una sesión vencida', async () => {
    const storage = makeStorage(makeSession({ expiresAt: NOW }));

    await expect(new RestoreSessionUseCase(storage, () => NOW).execute()).resolves.toBeNull();
    expect(storage.clear).toHaveBeenCalled();
  });
});

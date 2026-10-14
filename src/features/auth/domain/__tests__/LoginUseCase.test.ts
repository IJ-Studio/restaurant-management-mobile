import { AppError } from '../../../../core/errors/AppError';
import { LoginUseCase } from '../usecases/LoginUseCase';
import { makeRepository, makeSession, makeStorage } from '../../__fixtures__/auth';

const credentials = { email: ' ana@quijote.mx ', password: 'Pass#2026' };

describe('LoginUseCase', () => {
  it('inicia sesión, guarda la sesión y la devuelve', async () => {
    const session = makeSession();
    const repository = makeRepository(session);
    const storage = makeStorage();

    await expect(new LoginUseCase(repository, storage).execute(credentials)).resolves.toBe(session);
    expect(repository.signIn).toHaveBeenCalledWith({ email: 'ana@quijote.mx', password: 'Pass#2026' });
    expect(storage.save).toHaveBeenCalledWith(session);
  });

  it('no llama al API si las credenciales no pasan la validación', async () => {
    const repository = makeRepository();
    const useCase = new LoginUseCase(repository, makeStorage());

    await expect(useCase.execute({ email: 'ana', password: 'Pass#2026' })).rejects.toMatchObject({
      kind: 'validation',
      message: 'Ingresa un correo válido.',
    });
    expect(repository.signIn).not.toHaveBeenCalled();
  });

  it('rechaza cuentas que no son del personal sin guardar la sesión', async () => {
    const session = makeSession();
    session.user.role = 'cliente';
    const storage = makeStorage();

    await expect(
      new LoginUseCase(makeRepository(session), storage).execute(credentials),
    ).rejects.toMatchObject({
      kind: 'forbidden',
    });
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('propaga el error del repositorio sin guardar nada', async () => {
    const repository = makeRepository();
    repository.signIn.mockRejectedValue(new AppError('unauthorized', 'Correo o contraseña incorrectos.'));
    const storage = makeStorage();

    await expect(new LoginUseCase(repository, storage).execute(credentials)).rejects.toMatchObject({
      kind: 'unauthorized',
    });
    expect(storage.save).not.toHaveBeenCalled();
  });
});

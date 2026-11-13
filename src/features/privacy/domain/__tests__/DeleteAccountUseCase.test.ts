import { AppError } from '../../../../core/errors/AppError';
import { makeStorage } from '../../../auth/__fixtures__/auth';
import { makePrivacyRepository } from '../../__fixtures__/privacy';
import { DeleteAccountUseCase, PASSWORD_REQUIRED } from '../usecases/DeleteAccountUseCase';

describe('DeleteAccountUseCase', () => {
  it('elimina la cuenta en el servidor y borra la sesión del teléfono', async () => {
    const repository = makePrivacyRepository();
    const storage = makeStorage();

    await new DeleteAccountUseCase(repository, storage).execute('Prueba#2026');

    expect(repository.deleteAccount).toHaveBeenCalledWith('Prueba#2026');
    expect(storage.clear).toHaveBeenCalled();
  });

  it('sin contraseña no llama al servidor', async () => {
    const repository = makePrivacyRepository();

    await expect(new DeleteAccountUseCase(repository, makeStorage()).execute('')).rejects.toThrow(
      PASSWORD_REQUIRED,
    );
    expect(repository.deleteAccount).not.toHaveBeenCalled();
  });

  it('si el servidor rechaza (contraseña incorrecta), la sesión local se conserva', async () => {
    const repository = makePrivacyRepository();
    repository.deleteAccount.mockRejectedValue(
      new AppError('validation', 'La contraseña no es correcta', 400),
    );
    const storage = makeStorage();

    await expect(new DeleteAccountUseCase(repository, storage).execute('mala')).rejects.toThrow(
      'La contraseña no es correcta',
    );
    expect(storage.clear).not.toHaveBeenCalled();
  });
});

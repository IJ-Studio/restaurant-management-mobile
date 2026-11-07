import { AppError } from '../../../../core/errors/AppError';
import { makeSession, makeStorage } from '../../../auth/__fixtures__/auth';
import { normalizePhone, PASSWORD_RULES, validatePasswordChange, validateProfile } from '../entities/Profile';
import type { ProfileRepository } from '../repositories/ProfileRepository';
import { ChangePasswordUseCase } from '../usecases/ChangePasswordUseCase';
import { GetProfileUseCase } from '../usecases/GetProfileUseCase';
import { UpdateProfileUseCase } from '../usecases/UpdateProfileUseCase';

const profile = { id: '7', name: 'Ana', lastname: 'López', email: 'ana@quijote.mx', phone: '+527711234567' };

function makeRepository(): jest.Mocked<ProfileRepository> {
  return {
    get: jest.fn().mockResolvedValue(profile),
    update: jest.fn().mockImplementation(async (_id, changes) => ({ ...profile, ...changes })),
    changePassword: jest.fn().mockResolvedValue(undefined),
  };
}

describe('normalizePhone', () => {
  it.each([
    ['771 123 4567', '+527711234567'],
    ['(771) 123-4567', '+527711234567'],
    ['52 771 123 4567', '+527711234567'],
    ['+1 555 123 4567', '+15551234567'],
    ['  ', undefined],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });
});

describe('validateProfile', () => {
  it('exige nombre y apellido, y un teléfono válido si se escribe', () => {
    expect(validateProfile({ name: 'Ana', lastname: 'López', phone: '' })).toEqual({});
    expect(validateProfile({ name: ' ', lastname: 'x'.repeat(51), phone: '123' })).toEqual({
      name: 'Escribe tu nombre (máximo 50 caracteres).',
      lastname: 'Escribe tu apellido (máximo 50 caracteres).',
      phone: 'Escribe 10 dígitos o el número con lada internacional (+52…).',
    });
  });
});

describe('validatePasswordChange', () => {
  it('pide la actual, los requisitos y que coincidan', () => {
    expect(validatePasswordChange({ current: '', next: 'corta', confirm: 'otra' })).toEqual({
      current: 'Escribe tu contraseña actual.',
      next: 'La contraseña nueva no cumple todos los requisitos.',
      confirm: 'Las contraseñas no coinciden.',
    });
    expect(
      validatePasswordChange({ current: 'Vieja#2026', next: 'Vieja#2026', confirm: 'Vieja#2026' }),
    ).toEqual({
      next: 'La contraseña nueva debe ser distinta de la actual.',
    });
    expect(
      validatePasswordChange({ current: 'Vieja#2026', next: 'Nueva#2026', confirm: 'Nueva#2026' }),
    ).toEqual({});
  });

  it('cada requisito se revisa por separado', () => {
    const met = (password: string) => PASSWORD_RULES.filter((rule) => rule.test(password)).length;
    expect(met('Nueva#2026')).toBe(5);
    expect(met('nueva2026')).toBe(3);
  });
});

describe('casos de uso del perfil', () => {
  it('GetProfileUseCase consulta el perfil del usuario', async () => {
    const repository = makeRepository();
    await expect(new GetProfileUseCase(repository).execute('7')).resolves.toEqual(profile);
    expect(repository.get).toHaveBeenCalledWith('7');
  });

  it('UpdateProfileUseCase limpia los datos, guarda y actualiza la sesión guardada', async () => {
    const repository = makeRepository();
    const storage = makeStorage();
    const session = makeSession();

    const result = await new UpdateProfileUseCase(repository, storage).execute(session, {
      name: '  Ana María ',
      lastname: ' López ',
      phone: '771 123 4567',
    });

    expect(repository.update).toHaveBeenCalledWith('7', {
      name: 'Ana María',
      lastname: 'López',
      phone: '+527711234567',
    });
    expect(result.session.user).toMatchObject({ name: 'Ana María', lastname: 'López', role: 'mesero' });
    expect(result.session.token).toBe(session.token);
    expect(storage.save).toHaveBeenCalledWith(result.session);
  });

  it('UpdateProfileUseCase sin teléfono no lo manda; si el llavero falla, igual responde', async () => {
    const repository = makeRepository();
    const storage = makeStorage();
    storage.save.mockRejectedValue(new Error('keychain'));

    await expect(
      new UpdateProfileUseCase(repository, storage).execute(makeSession(), {
        name: 'Ana',
        lastname: 'López',
        phone: '',
      }),
    ).resolves.toMatchObject({ profile: { name: 'Ana' } });
    expect(repository.update).toHaveBeenCalledWith('7', { name: 'Ana', lastname: 'López', phone: undefined });
  });

  it('UpdateProfileUseCase y ChangePasswordUseCase no llaman al API con datos inválidos', async () => {
    const repository = makeRepository();
    await expect(
      new UpdateProfileUseCase(repository, makeStorage()).execute(makeSession(), {
        name: '',
        lastname: 'L',
        phone: '',
      }),
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      new ChangePasswordUseCase(repository).execute('7', { current: 'a', next: 'b', confirm: 'b' }),
    ).rejects.toThrow('La contraseña nueva no cumple todos los requisitos.');
    expect(repository.update).not.toHaveBeenCalled();
    expect(repository.changePassword).not.toHaveBeenCalled();
  });

  it('ChangePasswordUseCase manda la actual y la nueva', async () => {
    const repository = makeRepository();
    await new ChangePasswordUseCase(repository).execute('7', {
      current: 'Vieja#2026',
      next: 'Nueva#2026',
      confirm: 'Nueva#2026',
    });
    expect(repository.changePassword).toHaveBeenCalledWith('7', 'Vieja#2026', 'Nueva#2026');
  });
});

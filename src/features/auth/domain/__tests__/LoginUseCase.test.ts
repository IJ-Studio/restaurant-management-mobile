import { AppError } from '../../../../core/errors/AppError';
import type { Session } from '../entities/Session';
import type { AuthRepository } from '../repositories/AuthRepository';
import { INVALID_CREDENTIALS, LoginUseCase, validateCredentials } from '../usecases/LoginUseCase';

const session: Session = {
  token: 'a.b.c',
  user: { id: '7', name: 'Ana', lastname: 'López', email: 'ana@resto.mx', role: 'mesero' },
};

function makeRepository(overrides: Partial<AuthRepository> = {}): jest.Mocked<AuthRepository> {
  return {
    signIn: jest.fn().mockResolvedValue(session),
    signOut: jest.fn(),
    getStoredSession: jest.fn(),
    clearStoredSession: jest.fn(),
    ...overrides,
  } as jest.Mocked<AuthRepository>;
}

describe('validateCredentials', () => {
  it.each([
    ['', '', 'Ingresa tu correo y tu contraseña.'],
    ['ana@resto.mx', '', 'Ingresa tu correo y tu contraseña.'],
    ['ana', '12345678', 'Ingresa un correo válido.'],
    ['ana@resto.mx', '1234567', 'La contraseña debe tener al menos 8 caracteres.'],
  ])('rechaza (%p, %p)', (email, password, message) => {
    expect(validateCredentials({ email, password })).toBe(message);
  });

  it('acepta credenciales con formato válido', () => {
    expect(validateCredentials({ email: 'ana@resto.mx', password: '12345678' })).toBeNull();
  });
});

describe('LoginUseCase', () => {
  it('devuelve la sesión con credenciales válidas y normaliza el correo', async () => {
    const repository = makeRepository();
    await expect(
      new LoginUseCase(repository).execute({ email: '  Ana@Resto.MX ', password: 'secreto123' }),
    ).resolves.toBe(session);
    expect(repository.signIn).toHaveBeenCalledWith({ email: 'ana@resto.mx', password: 'secreto123' });
  });

  it('no llama al API si el formulario es inválido', async () => {
    const repository = makeRepository();
    await expect(new LoginUseCase(repository).execute({ email: 'ana', password: 'x' })).rejects.toMatchObject({
      kind: 'validation',
    });
    expect(repository.signIn).not.toHaveBeenCalled();
  });

  it.each([
    ['contraseña incorrecta', new AppError('validation', 'Contraseña inválida', 400)],
    ['correo inexistente', new AppError('validation', 'Correo inválido', 400)],
    ['401 del API', new AppError('unauthorized', 'Unauthorized', 401)],
  ])('usa un mensaje genérico ante %s (no revela si el usuario existe)', async (_caso, apiError) => {
    const repository = makeRepository({ signIn: jest.fn().mockRejectedValue(apiError) });
    await expect(
      new LoginUseCase(repository).execute({ email: 'ana@resto.mx', password: 'secreto123' }),
    ).rejects.toMatchObject({ kind: 'unauthorized', message: INVALID_CREDENTIALS });
  });

  it('explica el bloqueo temporal por demasiados intentos (429)', async () => {
    const repository = makeRepository({
      signIn: jest.fn().mockRejectedValue(new AppError('rate-limit', 'ThrottlerException', 429)),
    });
    await expect(
      new LoginUseCase(repository).execute({ email: 'ana@resto.mx', password: 'secreto123' }),
    ).rejects.toMatchObject({ kind: 'rate-limit', message: expect.stringContaining('Demasiados intentos') });
  });

  it('deja pasar el error de red tal cual', async () => {
    const networkError = new AppError('network', 'No hay conexión con el servidor.');
    const repository = makeRepository({ signIn: jest.fn().mockRejectedValue(networkError) });
    await expect(
      new LoginUseCase(repository).execute({ email: 'ana@resto.mx', password: 'secreto123' }),
    ).rejects.toBe(networkError);
  });
});

import type { Session } from '../entities/Session';
import type { AuthRepository } from '../repositories/AuthRepository';
import { LogoutUseCase } from '../usecases/LogoutUseCase';
import { isTokenExpired, RestoreSessionUseCase } from '../usecases/RestoreSessionUseCase';

const NOW = Date.UTC(2026, 9, 12, 12, 0, 0);

function jwt(payload: object): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.firma`;
}

function sessionWith(token: string): Session {
  return { token, user: { id: '1', name: 'Ana', lastname: 'L', email: 'ana@resto.mx', role: 'admin' } };
}

function makeRepository(stored: Session | null): jest.Mocked<AuthRepository> {
  return {
    signIn: jest.fn(),
    signOut: jest.fn().mockResolvedValue(undefined),
    getStoredSession: jest.fn().mockResolvedValue(stored),
    clearStoredSession: jest.fn().mockResolvedValue(undefined),
  };
}

describe('isTokenExpired', () => {
  it('acepta un token vigente', () => {
    expect(isTokenExpired(jwt({ exp: NOW / 1000 + 3600 }), NOW)).toBe(false);
  });

  it('rechaza un token vencido o a punto de vencer', () => {
    expect(isTokenExpired(jwt({ exp: NOW / 1000 - 1 }), NOW)).toBe(true);
    expect(isTokenExpired(jwt({ exp: NOW / 1000 + 10 }), NOW)).toBe(true);
  });

  it.each(['basura', 'a.%%%.c', jwt({ sub: 1 }), ''])('trata un token malformado (%p) como vencido', (token) => {
    expect(isTokenExpired(token, NOW)).toBe(true);
  });
});

describe('RestoreSessionUseCase', () => {
  it('devuelve null si no hay sesión guardada', async () => {
    await expect(new RestoreSessionUseCase(makeRepository(null), () => NOW).execute()).resolves.toBeNull();
  });

  it('restaura la sesión guardada si el token sigue vigente', async () => {
    const session = sessionWith(jwt({ exp: NOW / 1000 + 3600 }));
    await expect(new RestoreSessionUseCase(makeRepository(session), () => NOW).execute()).resolves.toBe(session);
  });

  it('borra la sesión guardada si el token ya venció', async () => {
    const repository = makeRepository(sessionWith(jwt({ exp: NOW / 1000 - 60 })));
    await expect(new RestoreSessionUseCase(repository, () => NOW).execute()).resolves.toBeNull();
    expect(repository.clearStoredSession).toHaveBeenCalled();
  });
});

describe('LogoutUseCase', () => {
  it('revoca el token en el API por defecto', async () => {
    const repository = makeRepository(null);
    await new LogoutUseCase(repository).execute();
    expect(repository.signOut).toHaveBeenCalled();
  });

  it('solo borra la sesión local cuando el API ya rechazó el token', async () => {
    const repository = makeRepository(null);
    await new LogoutUseCase(repository).execute({ revoke: false });
    expect(repository.signOut).not.toHaveBeenCalled();
    expect(repository.clearStoredSession).toHaveBeenCalled();
  });
});

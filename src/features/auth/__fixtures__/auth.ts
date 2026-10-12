import type { Session } from '../domain/entities/Session';
import type { AuthRepository } from '../domain/repositories/AuthRepository';
import type { SessionStorage } from '../domain/repositories/SessionStorage';

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    token: 'header.payload.signature',
    expiresAt: Date.now() + 60 * 60 * 1000,
    user: { id: '7', name: 'Ana', lastname: 'López', email: 'ana@quijote.mx', role: 'mesero' },
    ...overrides,
  };
}

export function makeRepository(session: Session = makeSession()): jest.Mocked<AuthRepository> {
  return {
    signIn: jest.fn().mockResolvedValue(session),
    signOut: jest.fn().mockResolvedValue(undefined),
  };
}

export function makeStorage(stored: Session | null = null): jest.Mocked<SessionStorage> {
  return {
    save: jest.fn().mockResolvedValue(undefined),
    load: jest.fn().mockResolvedValue(stored),
    clear: jest.fn().mockResolvedValue(undefined),
  };
}

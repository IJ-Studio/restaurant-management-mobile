import type { Session } from '../entities/Session';
import type { AuthRepository } from '../repositories/AuthRepository';

/** Margen para no restaurar un token que vence en segundos. */
const EXPIRY_MARGIN_MS = 30_000;

/**
 * Lee `exp` del JWT para saber si sigue vigente. No valida la firma: eso lo hace el API
 * en cada petición; aquí solo se evita abrir la app con una sesión que ya venció.
 */
export function isTokenExpired(token: string, now = Date.now()): boolean {
  const payload = token.split('.')[1];
  if (!payload) return true;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof json.exp !== 'number') return true;
    return json.exp * 1000 <= now + EXPIRY_MARGIN_MS;
  } catch {
    return true;
  }
}

/** Hidrata la sesión al abrir la app: devuelve la guardada si su token sigue vigente. */
export class RestoreSessionUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly now: () => number = Date.now,
  ) {}

  async execute(): Promise<Session | null> {
    const session = await this.repository.getStoredSession();
    if (!session) return null;
    if (isTokenExpired(session.token, this.now())) {
      await this.repository.clearStoredSession();
      return null;
    }
    return session;
  }
}

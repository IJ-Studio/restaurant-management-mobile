export type AppErrorKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'validation'
  | 'rate-limit'
  | 'server'
  | 'unknown';

/** Error de la app independiente de HTTP: es lo único que ven los casos de uso y los ViewModels. */
export class AppError extends Error {
  constructor(
    readonly kind: AppErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function kindFromStatus(status: number): AppErrorKind {
  if (status === 400 || status === 422) return 'validation';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 429) return 'rate-limit';
  if (status >= 500) return 'server';
  return 'unknown';
}

/** Fallas pasajeras: vale la pena reintentar. Un 4xx no cambia por reintentar. */
export function isTransient(error: unknown): boolean {
  return error instanceof AppError && (error.kind === 'network' || error.kind === 'timeout' || error.kind === 'server');
}

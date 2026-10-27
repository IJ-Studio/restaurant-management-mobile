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

export const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró. Vuelve a iniciar sesión.';
export const FORBIDDEN_MESSAGE = 'No tienes permiso para realizar esta acción.';
export const SERVER_ERROR_MESSAGE = 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.';
export const UNEXPECTED_MESSAGE = 'Ocurrió un error inesperado.';

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

/** Texto para la pantalla: el de AppError ya es legible; cualquier otro error usa el de la feature. */
export function userMessage(error: unknown, fallback: string): string {
  return error instanceof AppError ? error.message : fallback;
}

const RETRYABLE: readonly AppErrorKind[] = ['network', 'timeout', 'server', 'unknown'];

/** Reintentar solo tiene sentido si el fallo es pasajero; un 4xx falla igual la segunda vez. */
export function isRetryable(error: unknown): boolean {
  return !(error instanceof AppError) || RETRYABLE.includes(error.kind);
}

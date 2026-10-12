import { AppError } from '../../../../core/errors/AppError';

export function errorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  return 'Ocurrió un error inesperado.';
}

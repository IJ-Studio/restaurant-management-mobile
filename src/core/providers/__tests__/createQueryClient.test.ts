import { AppError } from '../../errors/AppError';
import { createQueryClient } from '../AppProviders';

describe('createQueryClient', () => {
  const retry = createQueryClient().getDefaultOptions().queries?.retry as (
    failureCount: number,
    error: Error,
  ) => boolean;

  it('reintenta una vez una falla de red', () => {
    expect(retry(0, new AppError('network', 'x'))).toBe(true);
    expect(retry(1, new AppError('network', 'x'))).toBe(false);
  });

  it('no reintenta una sesión vencida ni falta de permisos', () => {
    expect(retry(0, new AppError('unauthorized', 'x'))).toBe(false);
    expect(retry(0, new AppError('forbidden', 'x'))).toBe(false);
  });
});

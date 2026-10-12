import { AppError, isTransient } from '../errors/AppError';
import { createQueryClient } from '../providers/AppProviders';

describe('política de reintentos', () => {
  it.each(['network', 'timeout', 'server'] as const)('reintenta %s', (kind) => {
    expect(isTransient(new AppError(kind, 'x'))).toBe(true);
  });

  it.each(['validation', 'unauthorized', 'forbidden', 'not-found', 'rate-limit', 'unknown'] as const)(
    'no reintenta %s',
    (kind) => {
      expect(isTransient(new AppError(kind, 'x'))).toBe(false);
    },
  );

  it('no reintenta errores que no son AppError', () => {
    expect(isTransient(new Error('x'))).toBe(false);
  });

  it('el QueryClient reintenta hasta 2 veces solo fallas pasajeras', () => {
    const retry = createQueryClient().getDefaultOptions().queries?.retry as (n: number, e: unknown) => boolean;
    expect(retry(0, new AppError('network', 'x'))).toBe(true);
    expect(retry(1, new AppError('server', 'x'))).toBe(true);
    expect(retry(2, new AppError('server', 'x'))).toBe(false);
    expect(retry(0, new AppError('forbidden', 'x'))).toBe(false);
  });
});

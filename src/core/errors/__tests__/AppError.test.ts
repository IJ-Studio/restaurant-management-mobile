import { AppError, isRetryable, userMessage } from '../AppError';

describe('userMessage', () => {
  it('usa el mensaje del AppError', () => {
    expect(userMessage(new AppError('validation', 'Elige la mesa.'), 'otro')).toBe('Elige la mesa.');
  });

  it('no muestra el texto de errores que no son AppError', () => {
    expect(userMessage(new TypeError('undefined is not a function'), 'No se pudo cargar.')).toBe(
      'No se pudo cargar.',
    );
  });
});

describe('isRetryable', () => {
  it.each(['network', 'timeout', 'server', 'unknown'] as const)('reintenta "%s"', (kind) => {
    expect(isRetryable(new AppError(kind, 'x'))).toBe(true);
  });

  it.each(['unauthorized', 'forbidden', 'not-found', 'validation', 'rate-limit'] as const)(
    'no reintenta "%s"',
    (kind) => {
      expect(isRetryable(new AppError(kind, 'x'))).toBe(false);
    },
  );

  it('reintenta errores desconocidos', () => {
    expect(isRetryable(new Error('x'))).toBe(true);
  });
});

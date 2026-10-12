const mockCaptureException = jest.fn();
jest.mock('@sentry/react-native', () => ({ init: jest.fn(), captureException: mockCaptureException }));

// El DSN se lee al cargar el módulo: se vuelve a cargar en cada prueba.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadSentry = (): typeof import('../sentry') => require('../sentry');

describe('reportHttpError', () => {
  beforeEach(() => {
    jest.resetModules();
    mockCaptureException.mockClear();
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
  });

  it('manda el error con método, ruta y status como tags', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://key@sentry.test/1';
    const { reportHttpError } = loadSentry();
    const error = new Error('server');

    reportHttpError(error, { method: 'GET', path: 'menu', status: 500 });

    expect(mockCaptureException).toHaveBeenCalledWith(error, {
      tags: { 'http.method': 'GET', 'http.path': 'menu', 'http.status': '500' },
    });
  });

  it('sin DSN no manda nada', () => {
    const { reportHttpError } = loadSentry();
    reportHttpError(new Error('x'), { method: 'GET', path: 'menu', status: 500 });
    expect(mockCaptureException).not.toHaveBeenCalled();
  });
});

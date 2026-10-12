import { AppError } from '../../errors/AppError';
import { HttpClient, type HttpClientOptions } from '../httpClient';

function jsonResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

function makeClient(fetchFn: jest.Mock, overrides: Partial<HttpClientOptions> = {}) {
  return new HttpClient({
    baseUrl: 'https://api.test/',
    timeoutMs: 1000,
    allowInsecure: false,
    fetchFn,
    ...overrides,
  });
}

describe('HttpClient', () => {
  it('arma la URL y devuelve el JSON de la respuesta', async () => {
    const fetchFn = jest.fn().mockImplementation(async () => jsonResponse(200, { ok: true }));
    const client = makeClient(fetchFn);

    await expect(client.get('/menu')).resolves.toEqual({ ok: true });
    expect(fetchFn).toHaveBeenCalledWith('https://api.test/menu', expect.objectContaining({ method: 'GET' }));
  });

  it('envía el body como JSON', async () => {
    const fetchFn = jest.fn().mockImplementation(async () => jsonResponse(201, { id: 1 }));
    await makeClient(fetchFn).post('auth/sign-in', { email: 'a@b.mx' });

    const [, init] = fetchFn.mock.calls[0];
    expect(init.body).toBe('{"email":"a@b.mx"}');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('inyecta el JWT solo cuando hay sesión', async () => {
    const fetchFn = jest.fn().mockImplementation(async () => jsonResponse(200, {}));
    const client = makeClient(fetchFn);

    await client.get('auth/me');
    expect(fetchFn.mock.calls[0][1].headers.Authorization).toBeUndefined();

    client.setTokenProvider(() => 'abc.def.ghi');
    await client.get('auth/me');
    expect(fetchFn.mock.calls[1][1].headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  it('avisa a la sesión cuando el API rechaza el token', async () => {
    const fetchFn = jest.fn().mockImplementation(async () => jsonResponse(401, { message: 'Unauthorized' }));
    const client = makeClient(fetchFn);
    const onUnauthorized = jest.fn();
    client.setUnauthorizedHandler(onUnauthorized);

    await expect(client.post('auth/sign-in', {})).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(onUnauthorized).not.toHaveBeenCalled();

    client.setTokenProvider(() => 'vencido');
    await expect(client.get('auth/me')).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it.each([
    [400, 'validation'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [429, 'rate-limit'],
    [500, 'server'],
  ])('convierte HTTP %i en AppError "%s"', async (status, kind) => {
    const fetchFn = jest.fn().mockImplementation(async () => jsonResponse(status, { message: 'falló' }));
    await expect(makeClient(fetchFn).get('x')).rejects.toMatchObject({ kind, status, message: 'falló' });
  });

  it('une los mensajes de validación de NestJS', async () => {
    const fetchFn = jest
      .fn()
      .mockImplementation(async () => jsonResponse(400, { message: ['email must be an email', 'password too short'] }));
    await expect(makeClient(fetchFn).get('x')).rejects.toThrow('email must be an email\npassword too short');
  });

  it('usa un mensaje genérico cuando la respuesta no trae uno', async () => {
    const fetchFn = jest.fn().mockResolvedValue(new Response('<html>error</html>', { status: 502 }));
    await expect(makeClient(fetchFn).get('x')).rejects.toThrow('Ocurrió un error inesperado.');
  });

  it('reporta error de red cuando fetch falla', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    await expect(makeClient(fetchFn).get('x')).rejects.toMatchObject({ kind: 'network' });
  });

  it('cancela la petición al vencer el tiempo límite', async () => {
    const fetchFn = jest.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    await expect(makeClient(fetchFn as jest.Mock, { timeoutMs: 10 }).get('x')).rejects.toMatchObject({
      kind: 'timeout',
    });
  });

  it('rechaza una API sin HTTPS fuera de desarrollo', async () => {
    const fetchFn = jest.fn();
    const client = makeClient(fetchFn, { baseUrl: 'http://api.test' });

    await expect(client.get('x')).rejects.toBeInstanceOf(AppError);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('permite HTTP en desarrollo (API local)', async () => {
    const fetchFn = jest.fn().mockImplementation(async () => jsonResponse(204));
    const client = makeClient(fetchFn, { baseUrl: 'http://192.168.1.10:10000', allowInsecure: true });

    await expect(client.delete('x')).resolves.toBeUndefined();
  });

  it('falla con un mensaje claro si no hay URL configurada', async () => {
    await expect(makeClient(jest.fn(), { baseUrl: '' }).get('x')).rejects.toThrow('EXPO_PUBLIC_API_URL');
  });
});

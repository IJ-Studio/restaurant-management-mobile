import {
  AppError,
  FORBIDDEN_MESSAGE,
  SERVER_ERROR_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from '../../errors/AppError';
import { UNTRUSTED_SERVER_MESSAGE } from '../certificatePinning';
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

  it('no envía nada hasta que termina la preparación (certificate pinning)', async () => {
    const fetchFn = jest.fn().mockImplementation(async () => jsonResponse(200, {}));
    let finishReady: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
      finishReady = resolve;
    });

    const pending = makeClient(fetchFn, { ready }).get('/menu');
    await Promise.resolve();
    expect(fetchFn).not.toHaveBeenCalled();

    finishReady();
    await pending;
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('avisa que la conexión no es segura si el pinning rechazó el certificado', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    const client = makeClient(fetchFn, { untrustedServer: () => true });

    await expect(client.get('/menu')).rejects.toMatchObject({
      kind: 'network',
      message: UNTRUSTED_SERVER_MESSAGE,
    });
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

  it.each([
    [400, 'validation'],
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [429, 'rate-limit'],
  ])('convierte HTTP %i en AppError "%s" con el mensaje del API', async (status, kind) => {
    const fetchFn = jest.fn().mockImplementation(async () => jsonResponse(status, { message: 'falló' }));
    await expect(makeClient(fetchFn).get('x')).rejects.toMatchObject({ kind, status, message: 'falló' });
  });

  describe('manejo global de errores', () => {
    it('un 401 con token avisa que la sesión venció y llama al manejador una vez por petición', async () => {
      const fetchFn = jest
        .fn()
        .mockImplementation(async () => jsonResponse(401, { message: 'Token revocado' }));
      const onUnauthorized = jest.fn();
      const client = makeClient(fetchFn);
      client.setTokenProvider(() => 'vencido');
      client.setUnauthorizedHandler(onUnauthorized);

      await expect(client.get('reservations')).rejects.toMatchObject({
        kind: 'unauthorized',
        status: 401,
        message: SESSION_EXPIRED_MESSAGE,
      });
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });

    describe('renovación de la sesión', () => {
      /** Responde 401 mientras llegue el token viejo y 200 con el nuevo. */
      const apiThatExpired = () =>
        jest.fn().mockImplementation(async (_url: string, init: RequestInit) => {
          const { Authorization } = init.headers as Record<string, string>;
          return Authorization === 'Bearer nuevo'
            ? jsonResponse(200, { ok: true })
            : jsonResponse(401, { message: 'Token no encontrado o expirado' });
        });

      function clientWithSession(fetchFn: jest.Mock) {
        let token = 'viejo';
        const client = makeClient(fetchFn);
        client.setTokenProvider(() => token);
        const onUnauthorized = jest.fn();
        client.setUnauthorizedHandler(onUnauthorized);
        const renew = (result: boolean) =>
          jest.fn().mockImplementation(async () => {
            if (result) token = 'nuevo';
            return result;
          });
        return { client, onUnauthorized, renew };
      }

      it('ante un 401 renueva y repite la petición con el token nuevo, sin cerrar la sesión', async () => {
        const fetchFn = apiThatExpired();
        const { client, onUnauthorized, renew } = clientWithSession(fetchFn);
        const refresher = renew(true);
        client.setSessionRefresher(refresher);

        await expect(client.post('pedidos/mesa', { mesaId: 4 })).resolves.toEqual({ ok: true });

        expect(refresher).toHaveBeenCalledTimes(1);
        expect(fetchFn).toHaveBeenCalledTimes(2);
        const [, retry] = fetchFn.mock.calls[1];
        expect(retry.body).toBe('{"mesaId":4}');
        expect(onUnauthorized).not.toHaveBeenCalled();
      });

      it('varias peticiones rechazadas a la vez comparten una sola renovación', async () => {
        const fetchFn = apiThatExpired();
        const { client, renew } = clientWithSession(fetchFn);
        const refresher = renew(true);
        client.setSessionRefresher(refresher);

        await Promise.all([client.get('menu'), client.get('mesas'), client.get('pedidos')]);

        expect(refresher).toHaveBeenCalledTimes(1);
      });

      it('si el API ya no acepta el refresco, la sesión vence como antes', async () => {
        const fetchFn = apiThatExpired();
        const { client, onUnauthorized, renew } = clientWithSession(fetchFn);
        client.setSessionRefresher(renew(false));

        await expect(client.get('menu')).rejects.toMatchObject({
          kind: 'unauthorized',
          message: SESSION_EXPIRED_MESSAGE,
        });
        expect(onUnauthorized).toHaveBeenCalledTimes(1);
        expect(fetchFn).toHaveBeenCalledTimes(1);
      });

      it('sin red al renovar, la petición falla pero la sesión no se cierra', async () => {
        const fetchFn = apiThatExpired();
        const { client, onUnauthorized } = clientWithSession(fetchFn);
        const offline = new AppError('network', 'No hay conexión con el servidor.');
        client.setSessionRefresher(jest.fn().mockRejectedValue(offline));

        await expect(client.get('menu')).rejects.toBe(offline);
        expect(onUnauthorized).not.toHaveBeenCalled();
      });

      it('la petición repetida no vuelve a renovar si el API la rechaza otra vez', async () => {
        const fetchFn = jest.fn().mockImplementation(async () => jsonResponse(401, { message: 'x' }));
        const { client, onUnauthorized, renew } = clientWithSession(fetchFn);
        const refresher = renew(true);
        client.setSessionRefresher(refresher);

        await expect(client.get('menu')).rejects.toMatchObject({ kind: 'unauthorized' });

        expect(refresher).toHaveBeenCalledTimes(1);
        expect(fetchFn).toHaveBeenCalledTimes(2);
        expect(onUnauthorized).toHaveBeenCalledTimes(1);
      });

      it('una petición anónima (el propio refresco) va sin token y no renueva', async () => {
        const fetchFn = jest.fn().mockImplementation(async () => jsonResponse(401, { message: 'expiró' }));
        const { client, onUnauthorized, renew } = clientWithSession(fetchFn);
        const refresher = renew(true);
        client.setSessionRefresher(refresher);

        await expect(
          client.post('auth/refresh', { refreshToken: 'r' }, { anonymous: true }),
        ).rejects.toMatchObject({ kind: 'unauthorized' });

        const [, init] = fetchFn.mock.calls[0];
        expect(init.headers.Authorization).toBeUndefined();
        expect(refresher).not.toHaveBeenCalled();
        expect(onUnauthorized).not.toHaveBeenCalled();
      });
    });

    it('un 401 sin token (credenciales malas) no toca la sesión', async () => {
      const fetchFn = jest
        .fn()
        .mockImplementation(async () => jsonResponse(401, { message: 'Credenciales inválidas' }));
      const onUnauthorized = jest.fn();
      const client = makeClient(fetchFn);
      client.setUnauthorizedHandler(onUnauthorized);

      await expect(client.post('auth/sign-in', {})).rejects.toThrow('Credenciales inválidas');
      expect(onUnauthorized).not.toHaveBeenCalled();
    });

    it('traduce el 403 genérico del RolesGuard', async () => {
      const fetchFn = jest
        .fn()
        .mockImplementation(async () =>
          jsonResponse(403, { message: 'Forbidden resource', statusCode: 403 }),
        );
      await expect(makeClient(fetchFn).get('x')).rejects.toMatchObject({
        kind: 'forbidden',
        message: FORBIDDEN_MESSAGE,
      });
    });

    it('respeta el mensaje propio de un 403', async () => {
      const fetchFn = jest
        .fn()
        .mockImplementation(async () =>
          jsonResponse(403, { message: 'Solo administradores pueden ver usuarios' }),
        );
      await expect(makeClient(fetchFn).get('x')).rejects.toThrow('Solo administradores pueden ver usuarios');
    });

    it.each([500, 502, 503])('un %i no muestra detalles internos del servidor', async (status) => {
      const fetchFn = jest
        .fn()
        .mockImplementation(async () => jsonResponse(status, { message: 'relation "orden" does not exist' }));
      await expect(makeClient(fetchFn).get('x')).rejects.toMatchObject({
        kind: 'server',
        status,
        message: SERVER_ERROR_MESSAGE,
      });
    });
  });

  it('une los mensajes de validación de NestJS', async () => {
    const fetchFn = jest
      .fn()
      .mockImplementation(async () =>
        jsonResponse(400, { message: ['email must be an email', 'password too short'] }),
      );
    await expect(makeClient(fetchFn).get('x')).rejects.toThrow('email must be an email\npassword too short');
  });

  it('usa un mensaje genérico cuando la respuesta no trae uno', async () => {
    const fetchFn = jest.fn().mockResolvedValue(new Response('<html>error</html>', { status: 409 }));
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

import { RETRY_DELAYS_MS, SseOrderEvents } from '../gateways/SseOrderEvents';

/** XMLHttpRequest falso: la prueba decide qué llega y cuándo termina la conexión. */
class FakeXhr {
  readyState = 0;
  status = 0;
  responseText = '';
  headers: Record<string, string> = {};
  url = '';
  aborted = false;
  onreadystatechange: (() => void) | null = null;
  onerror: (() => void) | null = null;
  open(_method: string, url: string) {
    this.url = url;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send() {}
  abort() {
    this.aborted = true;
  }
  /** Llega texto del servidor (la conexión sigue abierta). */
  receive(text: string, status = 200) {
    this.status = status;
    this.responseText += text;
    this.readyState = 3;
    this.onreadystatechange?.();
  }
  /** El servidor cierra la conexión. */
  end(status = 200) {
    this.status = status;
    this.readyState = 4;
    this.onreadystatechange?.();
  }
}

function setup(token: string | null = 'jwt-1') {
  const requests: FakeXhr[] = [];
  const source = new SseOrderEvents({
    baseUrl: 'https://api.test/',
    token: () => token,
    createRequest: () => {
      const xhr = new FakeXhr();
      requests.push(xhr);
      return xhr as unknown as XMLHttpRequest;
    },
  });
  const listener = { onReady: jest.fn(), onEvent: jest.fn() };
  const unsubscribe = source.subscribe(listener);
  return { requests, listener, unsubscribe };
}

describe('SseOrderEvents', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('se conecta al flujo con el token de la sesión', () => {
    const { requests } = setup();

    expect(requests[0].url).toBe('https://api.test/pedidos/stream');
    expect(requests[0].headers).toMatchObject({ Authorization: 'Bearer jwt-1', Accept: 'text/event-stream' });
  });

  it('sin sesión no se conecta', () => {
    expect(setup(null).requests).toHaveLength(0);
  });

  it('entrega ready y cada evento de pedido, aunque lleguen partidos', () => {
    const { requests, listener } = setup();

    requests[0].receive('event: ready\ndata: {}\n\nevent: order\ndata: {"change":"status",');
    expect(listener.onReady).toHaveBeenCalledTimes(1);
    expect(listener.onEvent).not.toHaveBeenCalled();

    requests[0].receive('"orderId":"o-1","estatus":"lista"}\n\nevent: ping\ndata: {}\n\n');
    expect(listener.onEvent).toHaveBeenCalledTimes(1);
    expect(listener.onEvent).toHaveBeenCalledWith({ change: 'status', orderId: 'o-1', status: 'lista' });
  });

  it('descarta eventos con forma inválida sin cortar el flujo', () => {
    const { requests, listener } = setup();

    requests[0].receive(
      'event: order\ndata: no-es-json\n\nevent: order\ndata: {"change":"sent","orderId":"o-2"}\n\n',
    );

    expect(listener.onEvent).toHaveBeenCalledTimes(1);
    expect(listener.onEvent).toHaveBeenCalledWith({ change: 'sent', orderId: 'o-2' });
  });

  it('si el servidor cierra el flujo, reconecta con espera creciente', () => {
    const { requests } = setup();

    requests[0].end();
    jest.advanceTimersByTime(RETRY_DELAYS_MS[0] - 1);
    expect(requests).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(requests).toHaveLength(2);

    requests[1].onerror?.();
    jest.advanceTimersByTime(RETRY_DELAYS_MS[1]);
    expect(requests).toHaveLength(3);
  });

  it('al reconectar con éxito la espera vuelve a empezar', () => {
    const { requests } = setup();
    requests[0].end();
    jest.advanceTimersByTime(RETRY_DELAYS_MS[0]);
    requests[1].receive('event: ready\ndata: {}\n\n');
    requests[1].end();

    jest.advanceTimersByTime(RETRY_DELAYS_MS[0]);

    expect(requests).toHaveLength(3);
  });

  it.each([401, 403])('con %s (sesión rechazada) no insiste', (status) => {
    const { requests } = setup();

    requests[0].end(status);
    jest.advanceTimersByTime(60_000);

    expect(requests).toHaveLength(1);
  });

  it('al desuscribirse corta la conexión y no reconecta', () => {
    const { requests, unsubscribe } = setup();
    requests[0].end();

    unsubscribe();
    jest.advanceTimersByTime(60_000);

    expect(requests[0].aborted).toBe(true);
    expect(requests).toHaveLength(1);
  });
});

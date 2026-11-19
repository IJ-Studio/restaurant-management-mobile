import { parseOrderEvent } from '../../domain/entities/OrderEvent';
import type { OrderEventsListener, OrderEventsSource } from '../../domain/ports/OrderEventsSource';

/** Espera antes de cada reintento; el último valor se repite. Escalonado para no saturar el API. */
export const RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000] as const;

const LOADING = 3;
const DONE = 4;

export interface SseOrderEventsOptions {
  baseUrl: string;
  /** Token de la sesión; sin token no se conecta. */
  token: () => string | null;
  /** Solo para pruebas: sustituye a `XMLHttpRequest`. */
  createRequest?: () => XMLHttpRequest;
}

/**
 * Adapter de `GET /pedidos/stream` (Server-Sent Events) al puerto `OrderEventsSource`. Usa
 * `XMLHttpRequest` porque el `fetch` de React Native no entrega la respuesta por partes y
 * `EventSource` no deja mandar la cabecera `Authorization`.
 */
export class SseOrderEvents implements OrderEventsSource {
  constructor(private readonly options: SseOrderEventsOptions) {}

  subscribe(listener: OrderEventsListener): () => void {
    const { baseUrl, token, createRequest } = this.options;
    let request: XMLHttpRequest | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let closed = false;

    const handleBlock = (block: string) => {
      let name = 'message';
      let data = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) name = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (name === 'ready') {
        attempt = 0;
        listener.onReady();
      } else if (name === 'order') {
        const event = parseOrderEvent(parseJson(data));
        if (event) listener.onEvent(event);
      }
      // `ping` solo mantiene viva la conexión.
    };

    const connect = () => {
      const current = token();
      if (closed || !current) return;
      const xhr = createRequest ? createRequest() : new XMLHttpRequest();
      request = xhr;
      let processed = 0;
      let finished = false;
      const retryLater = () => {
        finished = true;
        const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];
        attempt += 1;
        retryTimer = setTimeout(connect, delay);
      };

      xhr.open('GET', `${baseUrl.replace(/\/+$/, '')}/pedidos/stream`);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Authorization', `Bearer ${current}`);
      xhr.onreadystatechange = () => {
        if (closed || finished || (xhr.readyState !== LOADING && xhr.readyState !== DONE)) return;
        if (xhr.status >= 200 && xhr.status < 300) {
          // Solo los bloques completos (terminan en una línea en blanco) que faltan por leer.
          const text = xhr.responseText ?? '';
          const end = text.lastIndexOf('\n\n');
          if (end >= processed) {
            text.slice(processed, end).split('\n\n').forEach(handleBlock);
            processed = end + 2;
          }
        }
        if (xhr.readyState !== DONE) return;
        // Sesión rechazada: no se insiste; al renovarse el token, quien usa el flujo vuelve a suscribirse.
        if (xhr.status === 401 || xhr.status === 403) {
          finished = true;
          return;
        }
        // El servidor cierra el flujo cada cierto tiempo, o la red falló: se reconecta.
        retryLater();
      };
      xhr.onerror = () => {
        if (!closed && !finished) retryLater();
      };
      xhr.send();
    };

    connect();
    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      request?.abort();
    };
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

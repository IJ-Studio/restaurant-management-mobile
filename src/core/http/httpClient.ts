import { env } from '../config/env';
import { AppError, kindFromStatus } from '../errors/AppError';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type TokenProvider = () => string | null;
type UnauthorizedHandler = () => void;

export interface HttpClientOptions {
  baseUrl: string;
  timeoutMs: number;
  /** En producción solo se permite HTTPS (MASVS-NETWORK). */
  allowInsecure: boolean;
  fetchFn?: typeof fetch;
}

/**
 * Cliente HTTP de la app. Se usa una sola instancia (`httpClient`) que todos los
 * datasources reciben por inyección; el token JWT lo pone aquí y en ningún otro lugar.
 */
export class HttpClient {
  private tokenProvider: TokenProvider = () => null;
  private onUnauthorized: UnauthorizedHandler = () => {};
  private readonly baseUrl: string;

  constructor(private readonly options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
  }

  /** La sesión (HU-01) registra aquí de dónde sale el token. */
  setTokenProvider(provider: TokenProvider): void {
    this.tokenProvider = provider;
  }

  /** Se llama cuando el API rechaza el token (401): no hay refresh token, la sesión se cierra. */
  setUnauthorizedHandler(handler: UnauthorizedHandler): void {
    this.onUnauthorized = handler;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  private async request<T>(method: Method, path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const token = this.tokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs);
    const fetchFn = this.options.fetchFn ?? fetch;

    let response: Response;
    try {
      response = await fetchFn(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      if (controller.signal.aborted) {
        throw new AppError('timeout', 'El servidor tardó demasiado en responder.');
      }
      throw new AppError('network', 'No hay conexión con el servidor.');
    } finally {
      clearTimeout(timer);
    }

    const data = await readBody(response);
    if (!response.ok) {
      if (response.status === 401 && token) this.onUnauthorized();
      throw new AppError(kindFromStatus(response.status), errorMessage(data), response.status);
    }
    return data as T;
  }

  private buildUrl(path: string): string {
    if (!this.baseUrl) {
      throw new AppError('unknown', 'Falta configurar EXPO_PUBLIC_API_URL.');
    }
    if (!this.options.allowInsecure && !this.baseUrl.startsWith('https://')) {
      throw new AppError('network', 'La API debe usar HTTPS.');
    }
    return `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
  }
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** NestJS responde `{ message: string | string[] }`; se usa solo si es texto legible. */
function errorMessage(data: unknown): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const { message } = data as { message: unknown };
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.filter((m) => typeof m === 'string').join('\n');
  }
  return 'Ocurrió un error inesperado.';
}

export const httpClient = new HttpClient({
  baseUrl: env.apiUrl,
  timeoutMs: env.httpTimeoutMs,
  allowInsecure: __DEV__,
});

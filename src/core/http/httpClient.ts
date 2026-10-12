import { env } from '../config/env';
import { AppError, kindFromStatus, type AppErrorKind } from '../errors/AppError';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type TokenProvider = () => string | null;
type UnauthorizedHandler = () => void;
export interface HttpErrorContext {
  method: Method;
  /** Ruta sin query string (ahí pueden ir datos personales). */
  path: string;
  status: number;
}
type ErrorReporter = (error: AppError, context: HttpErrorContext) => void;

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
  private reportError: ErrorReporter = () => {};
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

  /** Errores 5xx: se reportan a monitoreo (Sentry) desde aquí, no en cada pantalla. */
  setErrorReporter(reporter: ErrorReporter): void {
    this.reportError = reporter;
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
      const kind = kindFromStatus(response.status);
      const error = new AppError(kind, errorMessage(kind, data), response.status);
      if (response.status === 401 && token) this.onUnauthorized();
      if (kind === 'server') {
        this.reportError(error, { method, path: path.split('?')[0], status: response.status });
      }
      throw error;
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

// Mensajes propios para errores donde el del API no le sirve al personal (o puede filtrar detalles internos).
const MESSAGE_BY_KIND: Partial<Record<AppErrorKind, string>> = {
  forbidden: 'No tienes permiso para hacer esto.',
  'rate-limit': 'Demasiadas peticiones. Espera un momento e inténtalo de nuevo.',
  server: 'El servidor tuvo un problema. Inténtalo de nuevo en un momento.',
};

/** NestJS responde `{ message: string | string[] }`; se usa solo si es texto legible. */
function errorMessage(kind: AppErrorKind, data: unknown): string {
  const fixed = MESSAGE_BY_KIND[kind];
  if (fixed) return fixed;
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

import { env } from '../config/env';
import {
  AppError,
  FORBIDDEN_MESSAGE,
  kindFromStatus,
  SERVER_ERROR_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  UNEXPECTED_MESSAGE,
} from '../errors/AppError';

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
 * También es el único lugar que traduce errores HTTP: los services y hooks reciben un
 * AppError con un mensaje listo para mostrar y no revisan códigos de estado.
 */
export class HttpClient {
  private tokenProvider: TokenProvider = () => null;
  private unauthorizedHandler: UnauthorizedHandler = () => undefined;
  private readonly baseUrl: string;

  constructor(private readonly options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
  }

  /** La sesión (HU-01) registra aquí de dónde sale el token. */
  setTokenProvider(provider: TokenProvider): void {
    this.tokenProvider = provider;
  }

  /** Se llama cuando el API rechaza el token (vencido o revocado); la sesión decide qué hacer. */
  setUnauthorizedHandler(handler: UnauthorizedHandler): void {
    this.unauthorizedHandler = handler;
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
    if (!response.ok) throw this.toAppError(response.status, data, token !== null && token !== '');
    return data as T;
  }

  private toAppError(status: number, data: unknown, sentToken: boolean): AppError {
    const kind = kindFromStatus(status);
    const serverMessage = errorMessage(data);

    // Un 401 sin token es el login con credenciales malas; con token, la sesión ya no sirve.
    if (kind === 'unauthorized' && sentToken) {
      this.unauthorizedHandler();
      return new AppError(kind, SESSION_EXPIRED_MESSAGE, status);
    }
    // El RolesGuard de NestJS responde "Forbidden resource" en inglés; los mensajes propios se respetan.
    if (kind === 'forbidden' && (!serverMessage || serverMessage === 'Forbidden resource')) {
      return new AppError(kind, FORBIDDEN_MESSAGE, status);
    }
    // Un 5xx puede traer detalles internos (stack, SQL): nunca se muestran.
    if (kind === 'server') return new AppError(kind, SERVER_ERROR_MESSAGE, status);
    return new AppError(kind, serverMessage ?? UNEXPECTED_MESSAGE, status);
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
function errorMessage(data: unknown): string | null {
  if (data && typeof data === 'object' && 'message' in data) {
    const { message } = data as { message: unknown };
    if (typeof message === 'string') return message || null;
    if (Array.isArray(message)) return message.filter((m) => typeof m === 'string').join('\n') || null;
  }
  return null;
}

export const httpClient = new HttpClient({
  baseUrl: env.apiUrl,
  timeoutMs: env.httpTimeoutMs,
  allowInsecure: __DEV__,
});

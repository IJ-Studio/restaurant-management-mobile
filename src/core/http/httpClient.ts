import { env } from '../config/env';
import {
  AppError,
  FORBIDDEN_MESSAGE,
  kindFromStatus,
  SERVER_ERROR_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  UNEXPECTED_MESSAGE,
} from '../errors/AppError';
import {
  consumePinningRejection,
  initCertificatePinning,
  UNTRUSTED_SERVER_MESSAGE,
} from './certificatePinning';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type TokenProvider = () => string | null;
type UnauthorizedHandler = () => void;
/** Renueva la sesión: `false` si el API ya no la acepta; lanza un AppError si no hay red. */
type SessionRefresher = () => Promise<boolean>;

export interface RequestOptions {
  /** Sin token y sin manejo de sesión: para el refresco, que no debe renovarse a sí mismo. */
  anonymous?: boolean;
}

export interface HttpClientOptions {
  baseUrl: string;
  timeoutMs: number;
  /** En producción solo se permite HTTPS (MASVS-NETWORK). */
  allowInsecure: boolean;
  fetchFn?: typeof fetch;
  /** Ninguna petición sale antes de que termine (p. ej. la activación del certificate pinning). */
  ready?: Promise<unknown>;
  /** true si la última falla de red fue un certificado rechazado por el pinning. */
  untrustedServer?: () => boolean;
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
  private sessionRefresher: SessionRefresher | null = null;
  private refreshing: Promise<boolean> | null = null;
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

  /** Ante un 401 con token, la sesión intenta renovarse una vez antes de darse por vencida. */
  setSessionRefresher(refresher: SessionRefresher): void {
    this.sessionRefresher = refresher;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('DELETE', path, body);
  }

  private async request<T>(
    method: Method,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
    isRetry = false,
  ): Promise<T> {
    const url = this.buildUrl(path);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const token = options.anonymous ? null : this.tokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;

    // Antes del temporizador: la espera no cuenta como tiempo de respuesta del servidor.
    await this.options.ready;
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
      if (this.options.untrustedServer?.()) throw new AppError('network', UNTRUSTED_SERVER_MESSAGE);
      throw new AppError('network', 'No hay conexión con el servidor.');
    } finally {
      clearTimeout(timer);
    }

    const data = await readBody(response);
    // Token de acceso vencido o servidor reiniciado: se renueva la sesión y la petición se repite una vez.
    if (response.status === 401 && token && !isRetry && (await this.renewSession(token))) {
      return this.request<T>(method, path, body, options, true);
    }
    if (!response.ok) throw this.toAppError(response.status, data, token !== null && token !== '');
    return data as T;
  }

  /** `true` si hay un token nuevo con el que repetir. Las peticiones simultáneas comparten una sola renovación. */
  private async renewSession(usedToken: string): Promise<boolean> {
    if (!this.sessionRefresher) return false;
    // Otra petición ya renovó (o cerró) la sesión mientras esta viajaba con el token viejo.
    const current = this.tokenProvider();
    if (current !== usedToken) return current !== null;

    this.refreshing ??= this.sessionRefresher().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
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
  ready: initCertificatePinning(),
  untrustedServer: consumePinningRejection,
});

import type { User } from './User';

export interface Session {
  token: string;
  user: User;
  /** Momento (ms epoch) en que vence el token. */
  expiresAt: number;
  /** Renueva la sesión sin contraseña. Falta si el API no lo entrega: entonces la sesión vence como antes. */
  refreshToken?: string;
}

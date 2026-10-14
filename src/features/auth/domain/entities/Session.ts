import type { User } from './User';

export interface Session {
  token: string;
  user: User;
  /** Momento (ms epoch) en que vence el token. */
  expiresAt: number;
}

import { createStore, type StoreApi } from 'zustand/vanilla';

import type { Session } from '../../domain/entities/Session';

export type SessionStatus = 'restoring' | 'authenticated' | 'unauthenticated';

export interface SessionState {
  status: SessionStatus;
  session: Session | null;
  /** Aviso para el Login, p. ej. cuando el API rechazó un token vencido. */
  notice: string | null;
  setSession: (session: Session) => void;
  clearSession: () => void;
  expireSession: (notice: string) => void;
}

export type SessionStore = StoreApi<SessionState>;

/**
 * Única fuente de verdad de la sesión y el rol (HU-01, HU-02). Es un store "vanilla" para que
 * httpClient lea el token fuera de React; los componentes lo usan con `useSession`.
 */
export function createSessionStore(): SessionStore {
  return createStore<SessionState>()((set) => ({
    status: 'restoring',
    session: null,
    notice: null,
    setSession: (session) => set({ status: 'authenticated', session, notice: null }),
    clearSession: () => set({ status: 'unauthenticated', session: null, notice: null }),
    expireSession: (notice) => set({ status: 'unauthenticated', session: null, notice }),
  }));
}

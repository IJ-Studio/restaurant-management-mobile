import { createStore, type StoreApi } from 'zustand/vanilla';

import type { Session } from '../../domain/entities/Session';

export type SessionStatus = 'restoring' | 'authenticated' | 'unauthenticated';

export interface SessionState {
  status: SessionStatus;
  session: Session | null;
  setSession: (session: Session) => void;
  clearSession: () => void;
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
    setSession: (session) => set({ status: 'authenticated', session }),
    clearSession: () => set({ status: 'unauthenticated', session: null }),
  }));
}

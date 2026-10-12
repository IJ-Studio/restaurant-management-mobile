import { create } from 'zustand';

import type { Session } from '../../domain/entities/Session';

export type SessionStatus = 'checking' | 'authenticated' | 'unauthenticated';

interface SessionState {
  status: SessionStatus;
  session: Session | null;
  setSession: (session: Session | null) => void;
}

/**
 * Sesión del personal (token y rol). Vive en Zustand y no en el caché de React Query
 * porque debe sobrevivir aunque ese caché expire; se persiste en expo-secure-store.
 */
export const useSessionStore = create<SessionState>()((set) => ({
  status: 'checking',
  session: null,
  setSession: (session) => set({ session, status: session ? 'authenticated' : 'unauthenticated' }),
}));

/** Token actual, para el `httpClient` (fuera de React). */
export const selectToken = (): string | null => useSessionStore.getState().session?.token ?? null;

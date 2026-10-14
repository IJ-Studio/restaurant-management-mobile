import { useStore } from 'zustand';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import type { SessionState } from '../store/sessionStore';

export function useSession<T>(selector: (state: SessionState) => T): T {
  const { sessionStore } = useDependencies();
  return useStore(sessionStore, selector);
}

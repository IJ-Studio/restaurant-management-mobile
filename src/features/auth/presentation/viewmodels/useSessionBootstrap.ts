import { useEffect } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';

/** Al abrir la app recupera la sesión de SecureStore e hidrata el store. */
export function useSessionBootstrap(): void {
  const { restoreSessionUseCase, sessionStore } = useDependencies();

  useEffect(() => {
    let active = true;
    restoreSessionUseCase
      .execute()
      .catch(() => null)
      .then((session) => {
        if (!active) return;
        const { setSession, clearSession } = sessionStore.getState();
        if (session) setSession(session);
        else clearSession();
      });
    return () => {
      active = false;
    };
  }, [restoreSessionUseCase, sessionStore]);
}

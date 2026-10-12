import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { selectToken, useSessionStore } from '../store/sessionStore';

/**
 * Al abrir la app: conecta la sesión con el `httpClient` (token y cierre por 401)
 * e hidrata Zustand con la sesión guardada en expo-secure-store.
 */
export function useSessionBootstrap() {
  const { httpClient, restoreSessionUseCase, logoutUseCase } = useDependencies();
  const queryClient = useQueryClient();
  const status = useSessionStore((state) => state.status);

  useEffect(() => {
    const { setSession } = useSessionStore.getState();
    httpClient.setTokenProvider(selectToken);
    httpClient.setUnauthorizedHandler(() => {
      setSession(null);
      queryClient.clear();
      logoutUseCase.execute({ revoke: false }).catch(() => {});
    });

    let active = true;
    restoreSessionUseCase
      .execute()
      .catch(() => null)
      .then((session) => {
        if (active) setSession(session);
      });
    return () => {
      active = false;
    };
  }, [httpClient, restoreSessionUseCase, logoutUseCase, queryClient]);

  return status;
}

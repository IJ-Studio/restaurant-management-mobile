import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { useSessionStore } from '../store/sessionStore';

export function useLogout() {
  const { logoutUseCase } = useDependencies();
  const setSession = useSessionStore((state) => state.setSession);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => logoutUseCase.execute(),
    // La sesión local siempre se cierra, aunque el API no responda, y no quedan datos del usuario en caché.
    onSettled: () => {
      setSession(null);
      queryClient.clear();
    },
  });

  return { logout: () => mutation.mutate(), isLoading: mutation.isPending };
}

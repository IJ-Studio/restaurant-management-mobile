import { useMutation } from '@tanstack/react-query';

import { useDependencies } from '../../../../core/di/DependenciesProvider';

export function useLogout() {
  const { logoutUseCase, sessionStore } = useDependencies();

  const mutation = useMutation({
    mutationFn: () => logoutUseCase.execute(),
    onSettled: () => sessionStore.getState().clearSession(),
  });

  return { logout: () => mutation.mutate(), isLoggingOut: mutation.isPending };
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import { useSession } from '../../../auth/presentation/viewmodels/useSession';
import {
  PRIVACY_NOTICE_VERSION,
  type PrivacyPreference,
  type PrivacySettings,
} from '../../domain/entities/PrivacySettings';

export const privacyQueryKey = (userId: string) => ['privacy', userId] as const;

/** ViewModel de la privacidad de la cuenta: aviso aceptado y preferencias de exclusión. */
export function usePrivacySettings() {
  const { privacyRepository } = useDependencies();
  const userId = useSession((state) => state.session?.user.id ?? '');
  const queryClient = useQueryClient();
  const queryKey = privacyQueryKey(userId);
  const store = (settings: PrivacySettings) => queryClient.setQueryData(queryKey, settings);

  const query = useQuery({
    queryKey,
    queryFn: () => privacyRepository.get(),
    enabled: userId !== '',
    // Solo cambia cuando la propia persona lo cambia desde esta app.
    staleTime: Infinity,
  });
  const accept = useMutation({
    mutationFn: () => privacyRepository.acceptNotice(PRIVACY_NOTICE_VERSION),
    onSuccess: store,
    onError: () => feedback.error(),
  });
  const change = useMutation({
    mutationFn: ({ preference, enabled }: { preference: PrivacyPreference; enabled: boolean }) =>
      privacyRepository.setPreference(preference, enabled),
    onSuccess: store,
    onError: () => feedback.error(),
  });

  return {
    settings: query.data,
    isLoading: query.isPending,
    loadFailed: query.isError,
    retry: () => {
      query.refetch().catch(() => undefined);
    },
    acceptNotice: () => accept.mutate(),
    isAccepting: accept.isPending,
    acceptError: accept.error ? userMessage(accept.error, 'No se pudo registrar tu aceptación.') : null,
    /** Valor del switch: mientras se guarda muestra lo que la persona eligió. */
    isOn: (preference: PrivacyPreference): boolean =>
      change.isPending && change.variables.preference === preference
        ? change.variables.enabled
        : (query.data?.[preference] ?? true),
    setPreference: (preference: PrivacyPreference, enabled: boolean) =>
      change.mutate({ preference, enabled }),
    isSaving: change.isPending,
    saveError: change.error ? userMessage(change.error, 'No se pudo guardar tu preferencia.') : null,
  };
}

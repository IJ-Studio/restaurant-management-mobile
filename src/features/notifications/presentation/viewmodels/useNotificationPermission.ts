import { useCallback, useEffect } from 'react';
import { Linking } from 'react-native';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { useNotificationStore } from '../store/notificationStore';

/** Al entrar a la app pide el permiso una vez; si se negó, ofrece abrir Ajustes. */
export function useNotificationPermission({ askOnMount = false } = {}) {
  const { enableNotificationsUseCase } = useDependencies();
  const permission = useNotificationStore((state) => state.permission);
  const setPermission = useNotificationStore((state) => state.setPermission);

  const enable = useCallback(
    (ask: boolean) =>
      enableNotificationsUseCase
        .execute({ ask })
        .then(setPermission)
        .catch(() => {
          // Sin soporte (p. ej. simulador): se trata como no habilitado, sin romper la app.
          setPermission({ status: 'denied', canAskAgain: false });
        }),
    [enableNotificationsUseCase, setPermission],
  );

  useEffect(() => {
    if (askOnMount) enable(true);
  }, [askOnMount, enable]);

  const status = permission?.status ?? 'undetermined';
  return {
    status,
    enabled: status === 'granted',
    /** Si el sistema ya no deja preguntar, lo único que queda es Ajustes. */
    needsSettings: status === 'denied' || permission?.canAskAgain === false,
    request: () => enable(true),
    openSettings: () => Linking.openSettings(),
  };
}

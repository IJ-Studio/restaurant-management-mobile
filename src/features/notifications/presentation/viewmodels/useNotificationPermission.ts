import { useCallback } from 'react';
import { Linking } from 'react-native';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { useNotificationStore } from '../store/notificationStore';

/**
 * Estado del permiso de notificaciones. El permiso del sistema nunca se pide solo: primero se
 * explica para qué es (`NotificationPermissionPrompt`) y la persona decide.
 */
export function useNotificationPermission() {
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
  const check = useCallback(() => enable(false), [enable]);
  const request = useCallback(() => enable(true), [enable]);

  const status = permission?.status ?? 'undetermined';
  return {
    status,
    enabled: status === 'granted',
    /**
     * El sistema todavía deja preguntar: se puede mostrar la explicación y después el permiso. En
     * Android 13+ una instalación nueva llega como `denied` con `canAskAgain`, no como `undetermined`.
     */
    canAsk: permission !== null && status !== 'granted' && permission.canAskAgain,
    /** Si el sistema ya no deja preguntar, lo único que queda es Ajustes. */
    needsSettings: status !== 'granted' && permission?.canAskAgain === false,
    /** Consulta el permiso sin mostrar el diálogo del sistema. */
    check,
    /** Muestra el diálogo del sistema (solo tras la explicación o desde Perfil). */
    request,
    openSettings: () => Linking.openSettings(),
  };
}

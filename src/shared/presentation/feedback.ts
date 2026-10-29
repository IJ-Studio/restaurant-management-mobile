import * as Haptics from 'expo-haptics';

/** Corre la vibración sin que un fallo (simulador, permisos, pruebas) afecte a la pantalla. */
function safely(run: () => Promise<void> | void): void {
  void Promise.resolve()
    .then(run)
    .catch(() => undefined);
}

/** Vibración corta para confirmar acciones importantes (enviar a cocina, cobrar, entregar). */
export const feedback = {
  success: () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  select: () => safely(() => Haptics.selectionAsync()),
};

import type { PermissionState, PushNotifications } from '../ports/PushNotifications';

/**
 * Prepara las notificaciones y pide el permiso mientras el sistema lo permita (`canAskAgain`).
 * Si el usuario ya lo negó, no se insiste: se devuelve el estado para ofrecer ir a Ajustes.
 */
export class EnableNotificationsUseCase {
  constructor(private readonly notifications: PushNotifications) {}

  async execute({ ask }: { ask: boolean } = { ask: true }): Promise<PermissionState> {
    await this.notifications.configure();
    const current = await this.notifications.getPermission();
    if (current.status === 'granted' || !ask || !current.canAskAgain) return current;
    return this.notifications.requestPermission();
  }
}

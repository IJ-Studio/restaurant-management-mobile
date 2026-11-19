import type { DevicePlatform, DeviceRegistry, PushNotifications } from '../ports/PushNotifications';

/**
 * Da de alta este teléfono en el API cuando hay permiso de avisos y lo da de baja al cerrar sesión,
 * para que los avisos de una persona no lleguen al teléfono que ya dejó.
 */
export class DeviceRegistrationUseCase {
  private registered: string | null = null;

  constructor(
    private readonly notifications: PushNotifications,
    private readonly registry: DeviceRegistry,
    /** `null` en plataformas sin avisos (web). */
    private readonly platform: DevicePlatform | null,
  ) {}

  /** `true` si el teléfono quedó registrado. Sin permiso o sin token no llama al API. */
  async register(): Promise<boolean> {
    if (!this.platform) return false;
    const permission = await this.notifications.getPermission();
    if (permission.status !== 'granted') return false;
    const device = await this.notifications.getDeviceToken();
    if (!device) return false;
    // No es un secreto que se compare contra una entrada: solo evita repetir el alta del mismo teléfono.
    if (device !== this.registered) {
      await this.registry.register(device, this.platform);
      this.registered = device;
    }
    return true;
  }

  /** Nunca lanza: si el API no responde, el cierre de sesión sigue. */
  async unregister(): Promise<void> {
    const token = this.registered;
    if (!token) return;
    this.registered = null;
    try {
      await this.registry.unregister(token);
    } catch {
      // El API borra el token cuando Expo lo reporta como no registrado.
    }
  }
}

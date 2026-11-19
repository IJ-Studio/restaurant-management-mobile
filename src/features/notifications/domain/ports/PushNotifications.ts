export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export interface PermissionState {
  status: NotificationPermission;
  /** `false` cuando el sistema ya no deja volver a preguntar: hay que ir a Ajustes. */
  canAskAgain: boolean;
}

export interface IncomingNotification {
  title: string | null;
  body: string | null;
  data: Record<string, unknown>;
}

/**
 * Puerto de notificaciones del dispositivo. El dominio no conoce expo-notifications:
 * la implementación vive en `data/gateways`.
 */
export interface PushNotifications {
  configure(): Promise<void>;
  getPermission(): Promise<PermissionState>;
  requestPermission(): Promise<PermissionState>;
  /** Observer: se llama con cada notificación que llega con la app abierta. Devuelve cómo desuscribirse. */
  onNotification(listener: (notification: IncomingNotification) => void): () => void;
  /**
   * Observer: se llama cuando la persona toca un aviso, también con el que abrió la app estando
   * cerrada. Devuelve cómo desuscribirse.
   */
  onNotificationOpened(listener: (notification: IncomingNotification) => void): () => void;
  /** Token de Expo de este teléfono, o `null` si no se puede obtener (sin servicio de avisos). */
  getDeviceToken(): Promise<string | null>;
}

export type DevicePlatform = 'android' | 'ios';

/** Registro del teléfono en el API para que le lleguen los avisos de su usuario. */
export interface DeviceRegistry {
  register(token: string, platform: DevicePlatform): Promise<void>;
  unregister(token: string): Promise<void>;
}

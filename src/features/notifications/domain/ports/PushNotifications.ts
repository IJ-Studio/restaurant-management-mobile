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
}

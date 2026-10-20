import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type {
  IncomingNotification,
  PermissionState,
  PushNotifications,
} from '../../domain/ports/PushNotifications';

export const ANDROID_CHANNEL_ID = 'operacion';

function toState(response: { status: string; canAskAgain: boolean }): PermissionState {
  const status = response.status === 'granted' || response.status === 'denied' ? response.status : 'undetermined';
  return { status, canAskAgain: response.canAskAgain };
}

/** Adapter de expo-notifications al puerto `PushNotifications`. */
export class ExpoPushNotifications implements PushNotifications {
  private configured = false;

  async configure(): Promise<void> {
    if (this.configured) return;
    this.configured = true;
    // Con la app abierta también se muestran (el personal puede estar en otra pantalla).
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Operación del restaurante',
        importance: Notifications.AndroidImportance.HIGH,
        // Pantalla bloqueada: no se muestra el contenido (puede traer datos del pedido).
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      });
    }
  }

  async getPermission(): Promise<PermissionState> {
    return toState(await Notifications.getPermissionsAsync());
  }

  async requestPermission(): Promise<PermissionState> {
    return toState(await Notifications.requestPermissionsAsync());
  }

  onNotification(listener: (notification: IncomingNotification) => void): () => void {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      listener({ title, body, data: (data ?? {}) as Record<string, unknown> });
    });
    return () => subscription.remove();
  }
}

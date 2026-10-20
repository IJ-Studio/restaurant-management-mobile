import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ANDROID_CHANNEL_ID, ExpoPushNotifications } from '../gateways/ExpoPushNotifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationVisibility: { PRIVATE: 2 },
}));

const mocked = Notifications as jest.Mocked<typeof Notifications>;

describe('ExpoPushNotifications', () => {
  beforeEach(() => jest.clearAllMocks());

  it('configura el handler una sola vez y el canal privado en Android', async () => {
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    const gateway = new ExpoPushNotifications();

    await gateway.configure();
    await gateway.configure();

    expect(mocked.setNotificationHandler).toHaveBeenCalledTimes(1);
    expect(mocked.setNotificationChannelAsync).toHaveBeenCalledWith(
      ANDROID_CHANNEL_ID,
      expect.objectContaining({ lockscreenVisibility: 2 }),
    );
    Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
  });

  it('las notificaciones se muestran con la app abierta', async () => {
    await new ExpoPushNotifications().configure();
    const handler = mocked.setNotificationHandler.mock.calls[0][0];
    await expect(handler?.handleNotification({} as never)).resolves.toMatchObject({ shouldShowBanner: true });
  });

  it('traduce el permiso del sistema', async () => {
    mocked.getPermissionsAsync.mockResolvedValue({ status: 'denied', canAskAgain: false } as never);
    mocked.requestPermissionsAsync.mockResolvedValue({ status: 'granted', canAskAgain: true } as never);
    const gateway = new ExpoPushNotifications();

    await expect(gateway.getPermission()).resolves.toEqual({ status: 'denied', canAskAgain: false });
    await expect(gateway.requestPermission()).resolves.toEqual({ status: 'granted', canAskAgain: true });

    mocked.getPermissionsAsync.mockResolvedValue({ status: 'raro', canAskAgain: true } as never);
    await expect(gateway.getPermission()).resolves.toEqual({ status: 'undetermined', canAskAgain: true });
  });

  it('avisa a los observadores de cada notificación y permite desuscribirse', () => {
    const remove = jest.fn();
    let emit: (n: unknown) => void = () => {};
    mocked.addNotificationReceivedListener.mockImplementation((cb) => {
      emit = cb as (n: unknown) => void;
      return { remove } as never;
    });
    const listener = jest.fn();

    const unsubscribe = new ExpoPushNotifications().onNotification(listener);
    emit({ request: { content: { title: 'Pedido listo', body: 'Mesa 4', data: { pedidoId: 9 } } } });
    unsubscribe();

    expect(listener).toHaveBeenCalledWith({ title: 'Pedido listo', body: 'Mesa 4', data: { pedidoId: 9 } });
    expect(remove).toHaveBeenCalled();
  });
});

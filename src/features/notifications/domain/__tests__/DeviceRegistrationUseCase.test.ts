import { AppError } from '../../../../core/errors/AppError';
import type { DeviceRegistry, PermissionState, PushNotifications } from '../ports/PushNotifications';
import { DeviceRegistrationUseCase } from '../usecases/DeviceRegistrationUseCase';

const TOKEN = 'ExponentPushToken[abc]';
const granted: PermissionState = { status: 'granted', canAskAgain: true };

function setup(permission: PermissionState = granted, token: string | null = TOKEN) {
  const notifications = {
    getPermission: jest.fn().mockResolvedValue(permission),
    getDeviceToken: jest.fn().mockResolvedValue(token),
  } as unknown as jest.Mocked<PushNotifications>;
  const registry: jest.Mocked<DeviceRegistry> = {
    register: jest.fn().mockResolvedValue(undefined),
    unregister: jest.fn().mockResolvedValue(undefined),
  };
  return {
    notifications,
    registry,
    useCase: new DeviceRegistrationUseCase(notifications, registry, 'android'),
  };
}

describe('DeviceRegistrationUseCase', () => {
  it('con permiso concedido registra el token del teléfono', async () => {
    const { useCase, registry } = setup();

    await expect(useCase.register()).resolves.toBe(true);
    expect(registry.register).toHaveBeenCalledWith(TOKEN, 'android');
  });

  it.each(['denied', 'undetermined'] as const)(
    'con el permiso %s no pide el token ni llama al API',
    async (status) => {
      const { useCase, notifications, registry } = setup({ status, canAskAgain: true });

      await expect(useCase.register()).resolves.toBe(false);
      expect(notifications.getDeviceToken).not.toHaveBeenCalled();
      expect(registry.register).not.toHaveBeenCalled();
    },
  );

  it('sin token (teléfono sin servicio de avisos) no llama al API', async () => {
    const { useCase, registry } = setup(granted, null);

    await expect(useCase.register()).resolves.toBe(false);
    expect(registry.register).not.toHaveBeenCalled();
  });

  it('no repite el registro si el token no cambió', async () => {
    const { useCase, registry } = setup();

    await useCase.register();
    await useCase.register();

    expect(registry.register).toHaveBeenCalledTimes(1);
  });

  it('en una plataforma sin avisos no hace nada', async () => {
    const { notifications, registry } = setup();

    await expect(new DeviceRegistrationUseCase(notifications, registry, null).register()).resolves.toBe(
      false,
    );
    expect(notifications.getPermission).not.toHaveBeenCalled();
  });

  it('al cerrar sesión da de baja el teléfono registrado, una sola vez', async () => {
    const { useCase, registry } = setup();
    await useCase.register();

    await useCase.unregister();
    await useCase.unregister();

    expect(registry.unregister).toHaveBeenCalledTimes(1);
    expect(registry.unregister).toHaveBeenCalledWith(TOKEN);
  });

  it('si nunca se registró, cerrar sesión no llama al API', async () => {
    const { useCase, registry } = setup();

    await useCase.unregister();

    expect(registry.unregister).not.toHaveBeenCalled();
  });

  it('si el API falla al dar de baja, el cierre de sesión sigue', async () => {
    const { useCase, registry } = setup();
    registry.unregister.mockRejectedValue(new AppError('network', 'Sin conexión'));
    await useCase.register();

    await expect(useCase.unregister()).resolves.toBeUndefined();
  });
});

import type { PermissionState, PushNotifications } from '../ports/PushNotifications';
import { EnableNotificationsUseCase } from '../usecases/EnableNotificationsUseCase';

function makePort(current: PermissionState, afterRequest?: PermissionState): jest.Mocked<PushNotifications> {
  return {
    configure: jest.fn().mockResolvedValue(undefined),
    getPermission: jest.fn().mockResolvedValue(current),
    requestPermission: jest.fn().mockResolvedValue(afterRequest ?? current),
    onNotification: jest.fn(),
  };
}

describe('EnableNotificationsUseCase', () => {
  it('pide el permiso si nunca se ha preguntado', async () => {
    const port = makePort({ status: 'undetermined', canAskAgain: true }, { status: 'granted', canAskAgain: true });
    await expect(new EnableNotificationsUseCase(port).execute()).resolves.toEqual({ status: 'granted', canAskAgain: true });
    expect(port.configure).toHaveBeenCalled();
    expect(port.requestPermission).toHaveBeenCalled();
  });

  it('no vuelve a preguntar si ya está concedido', async () => {
    const port = makePort({ status: 'granted', canAskAgain: true });
    await new EnableNotificationsUseCase(port).execute();
    expect(port.requestPermission).not.toHaveBeenCalled();
  });

  it('si se negó, no insiste y devuelve el estado (para ofrecer Ajustes)', async () => {
    const port = makePort({ status: 'denied', canAskAgain: false });
    await expect(new EnableNotificationsUseCase(port).execute()).resolves.toEqual({
      status: 'denied',
      canAskAgain: false,
    });
    expect(port.requestPermission).not.toHaveBeenCalled();
  });

  it('con ask: false solo consulta', async () => {
    const port = makePort({ status: 'undetermined', canAskAgain: true });
    await new EnableNotificationsUseCase(port).execute({ ask: false });
    expect(port.requestPermission).not.toHaveBeenCalled();
  });

  it('no pregunta si el sistema ya no lo permite', async () => {
    const port = makePort({ status: 'undetermined', canAskAgain: false });
    await new EnableNotificationsUseCase(port).execute();
    expect(port.requestPermission).not.toHaveBeenCalled();
  });
});

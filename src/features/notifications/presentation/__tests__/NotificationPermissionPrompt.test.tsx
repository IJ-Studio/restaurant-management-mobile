import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import type { PermissionState } from '../../domain/ports/PushNotifications';
import { NotificationPermissionPrompt } from '../components/NotificationPermissionPrompt';
import { useNotificationStore } from '../store/notificationStore';

const undetermined: PermissionState = { status: 'undetermined', canAskAgain: true };
const granted: PermissionState = { status: 'granted', canAskAgain: true };

/** `check` responde al consultar el permiso; `afterRequest`, cuando la persona acepta en el sistema. */
async function setup(check: PermissionState, afterRequest: PermissionState = granted) {
  const execute = jest.fn(({ ask }: { ask: boolean }) => Promise.resolve(ask ? afterRequest : check));
  const deps = makeTestDependencies({ enableNotificationsUseCase: { execute } });
  await renderWithProviders(<NotificationPermissionPrompt />, deps);
  return { deps, execute };
}

describe('NotificationPermissionPrompt', () => {
  beforeEach(() => useNotificationStore.setState({ permission: null, rationaleDismissed: false }));

  it('explica para qué son los avisos antes de que aparezca el permiso del sistema', async () => {
    const { execute } = await setup(undetermined);

    // El modal aparece después de consultar el permiso: margen extra con la suite completa en paralelo.
    expect(
      await screen.findByRole('header', { name: 'Avisos de pedidos' }, { timeout: 5000 }),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(/te avisa cuando un pedido está listo para entregar o para cobrar/),
    ).toBeOnTheScreen();
    expect(execute).not.toHaveBeenCalledWith({ ask: true });
  });

  it('«Activar avisos» pide el permiso del sistema y, concedido, registra el teléfono', async () => {
    const { deps, execute } = await setup(undetermined);

    await fireEvent.press(await screen.findByRole('button', { name: 'Activar avisos' }));

    await waitFor(() => expect(deps.deviceRegistrationUseCase.register).toHaveBeenCalledTimes(1));
    expect(execute).toHaveBeenCalledWith({ ask: true });
    expect(screen.queryByRole('header', { name: 'Avisos de pedidos' })).toBeNull();
  });

  it('«Ahora no» cierra la explicación sin pedir el permiso ni registrar el teléfono', async () => {
    const { deps, execute } = await setup(undetermined);

    await fireEvent.press(await screen.findByRole('button', { name: 'Ahora no' }));

    expect(screen.queryByRole('header', { name: 'Avisos de pedidos' })).toBeNull();
    expect(execute).not.toHaveBeenCalledWith({ ask: true });
    expect(deps.deviceRegistrationUseCase.register).not.toHaveBeenCalled();
  });

  it('si la persona niega el permiso en el sistema, no se registra el teléfono', async () => {
    const { deps } = await setup(undetermined, { status: 'denied', canAskAgain: false });

    await fireEvent.press(await screen.findByRole('button', { name: 'Activar avisos' }));

    await waitFor(() => expect(useNotificationStore.getState().permission?.status).toBe('denied'));
    expect(deps.deviceRegistrationUseCase.register).not.toHaveBeenCalled();
  });

  it('con el permiso ya concedido no pregunta y registra el teléfono', async () => {
    const { deps } = await setup(granted);

    await waitFor(() => expect(deps.deviceRegistrationUseCase.register).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('header', { name: 'Avisos de pedidos' })).toBeNull();
  });

  it('si ya se negó antes, no insiste: queda la opción en Perfil', async () => {
    const { execute } = await setup({ status: 'denied', canAskAgain: false });

    await waitFor(() => expect(execute).toHaveBeenCalledWith({ ask: false }));
    expect(screen.queryByRole('header', { name: 'Avisos de pedidos' })).toBeNull();
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import type { Dependencies } from '../../../../core/di/dependencies';
import { DependenciesProvider } from '../../../../core/di/DependenciesProvider';
import { NotificationSettings } from '../components/NotificationSettings';
import { useNotificationStore } from '../store/notificationStore';

async function renderSettings(execute: jest.Mock) {
  const dependencies = { enableNotificationsUseCase: { execute } } as unknown as Dependencies;
  await render(
    <DependenciesProvider value={dependencies}>
      <NotificationSettings />
    </DependenciesProvider>,
  );
}

describe('NotificationSettings', () => {
  beforeEach(() => useNotificationStore.setState({ permission: null }));

  it('muestra que están activadas', async () => {
    useNotificationStore.setState({ permission: { status: 'granted', canAskAgain: true } });
    await renderSettings(jest.fn());
    expect(screen.getByText('Notificaciones: activadas')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('permite activarlas si no se ha preguntado y guarda el resultado en el store', async () => {
    const execute = jest.fn().mockResolvedValue({ status: 'granted', canAskAgain: true });
    await renderSettings(execute);

    await fireEvent.press(screen.getByText('Activar notificaciones'));

    expect(execute).toHaveBeenCalledWith({ ask: true });
    expect(await screen.findByText('Notificaciones: activadas')).toBeOnTheScreen();
    expect(useNotificationStore.getState().permission?.status).toBe('granted');
  });

  it('si se negó, lleva a Ajustes', async () => {
    useNotificationStore.setState({ permission: { status: 'denied', canAskAgain: false } });
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    await renderSettings(jest.fn());

    await fireEvent.press(screen.getByText('Abrir Ajustes'));
    expect(openSettings).toHaveBeenCalled();
  });

  it('si el dispositivo no soporta notificaciones, queda como desactivadas', async () => {
    const execute = jest.fn().mockRejectedValue(new Error('no soportado'));
    await renderSettings(execute);

    await fireEvent.press(screen.getByText('Activar notificaciones'));

    expect(await screen.findByText('Abrir Ajustes')).toBeOnTheScreen();
    expect(useNotificationStore.getState().permission).toEqual({ status: 'denied', canAskAgain: false });
  });
});

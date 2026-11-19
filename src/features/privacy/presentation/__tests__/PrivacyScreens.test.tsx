import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, Linking, Text, type AlertButton } from 'react-native';

import { AppError } from '../../../../core/errors/AppError';
import { errorReports } from '../../../../core/monitoring/errorReports';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeSession } from '../../../auth/__fixtures__/auth';
import { makePrivacy, makePrivacyRepository, pendingPrivacy } from '../../__fixtures__/privacy';
import { PRIVACY_NOTICE_VERSION } from '../../domain/entities/PrivacySettings';
import { PrivacyConsentGate } from '../components/PrivacyConsentGate';
import { DeleteAccountScreen } from '../screens/DeleteAccountScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';

function setup(privacyRepository = makePrivacyRepository()) {
  const deps = makeTestDependencies({ privacyRepository });
  deps.sessionStore.getState().setSession(makeSession());
  return deps;
}

const gate = (
  <PrivacyConsentGate>
    <Text>App del restaurante</Text>
  </PrivacyConsentGate>
);
const checkbox = () => screen.getByRole('checkbox', { name: 'He leído y acepto el aviso de privacidad' });
const acceptButton = () => screen.getByRole('button', { name: 'Aceptar y continuar' });

describe('Aviso de privacidad con consentimiento explícito', () => {
  it('quien no lo ha aceptado ve el aviso, con la casilla sin marcar y sin poder continuar', async () => {
    await renderWithProviders(gate, setup(makePrivacyRepository(pendingPrivacy())));

    expect(await screen.findByRole('header', { name: 'Aviso de privacidad' })).toBeOnTheScreen();
    expect(checkbox()).not.toBeChecked();
    expect(acceptButton()).toBeDisabled();
    expect(screen.queryByText('App del restaurante')).toBeNull();
  });

  it('al marcar la casilla y aceptar se registra la versión del aviso y entra a la app', async () => {
    const repository = makePrivacyRepository(pendingPrivacy());
    await renderWithProviders(gate, setup(repository));

    await fireEvent.press(await screen.findByRole('checkbox'));
    expect(checkbox()).toBeChecked();
    await fireEvent.press(acceptButton());

    expect(await screen.findByText('App del restaurante')).toBeOnTheScreen();
    expect(repository.acceptNotice).toHaveBeenCalledWith(PRIVACY_NOTICE_VERSION);
  });

  it('sin marcar la casilla, pulsar Aceptar no registra nada', async () => {
    const repository = makePrivacyRepository(pendingPrivacy());
    await renderWithProviders(gate, setup(repository));

    await fireEvent.press(await screen.findByRole('button', { name: 'Aceptar y continuar' }));

    expect(repository.acceptNotice).not.toHaveBeenCalled();
  });

  it('quien no acepta cierra la sesión', async () => {
    const deps = setup(makePrivacyRepository(pendingPrivacy()));
    await renderWithProviders(gate, deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'No acepto, cerrar sesión' }));

    await waitFor(() => expect(deps.sessionStore.getState().status).toBe('unauthenticated'));
    expect(deps.logoutUseCase.execute).toHaveBeenCalled();
  });

  it('si el aviso cambió de versión se vuelve a pedir', async () => {
    await renderWithProviders(gate, setup(makePrivacyRepository(makePrivacy({ noticeVersion: '2025-01' }))));

    expect(await screen.findByRole('header', { name: 'Aviso de privacidad' })).toBeOnTheScreen();
  });

  it('quien ya lo aceptó entra directo', async () => {
    await renderWithProviders(gate, setup());

    expect(await screen.findByText('App del restaurante')).toBeOnTheScreen();
  });

  it('si el API no responde no se detiene el servicio: entra y se pedirá después', async () => {
    const repository = makePrivacyRepository();
    repository.get.mockRejectedValue(new AppError('network', 'No hay conexión con el servidor.'));
    await renderWithProviders(gate, setup(repository));

    expect(await screen.findByText('App del restaurante')).toBeOnTheScreen();
  });

  it('si no se pudo registrar la aceptación, lo dice y deja reintentar', async () => {
    const repository = makePrivacyRepository(pendingPrivacy());
    repository.acceptNotice.mockRejectedValue(new AppError('network', 'No hay conexión con el servidor.'));
    await renderWithProviders(gate, setup(repository));

    await fireEvent.press(await screen.findByRole('checkbox'));
    await fireEvent.press(acceptButton());

    expect(await screen.findByText('No hay conexión con el servidor.')).toBeOnTheScreen();
    expect(screen.queryByText('App del restaurante')).toBeNull();
  });

  it('aplica la preferencia de reportes de errores y la restablece al salir', async () => {
    const view = await renderWithProviders(
      gate,
      setup(makePrivacyRepository(makePrivacy({ errorReports: false }))),
    );
    await screen.findByText('App del restaurante');

    expect(errorReports.isEnabled()).toBe(false);

    await view.unmount();
    expect(errorReports.isEnabled()).toBe(true);
  });
});

describe('PrivacyScreen', () => {
  it('muestra cuándo se aceptó el aviso y el estado de cada preferencia', async () => {
    const repository = makePrivacyRepository(makePrivacy({ pushNotifications: false }));
    await renderWithProviders(<PrivacyScreen onDeleteAccount={jest.fn()} />, setup(repository));

    expect(await screen.findByText(/^Lo aceptaste el .+ \(versión 2026-11\)\.$/)).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Avisos de pedidos' })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'Reportes de errores' })).toBeChecked();
  });

  it('apagar una preferencia la registra en el servidor (derecho de oposición)', async () => {
    const repository = makePrivacyRepository();
    repository.setPreference.mockResolvedValue(makePrivacy({ errorReports: false }));
    await renderWithProviders(<PrivacyScreen onDeleteAccount={jest.fn()} />, setup(repository));

    await fireEvent(await screen.findByRole('switch', { name: 'Reportes de errores' }), 'valueChange', false);

    await waitFor(() => expect(repository.setPreference).toHaveBeenCalledWith('errorReports', false));
    await waitFor(() =>
      expect(screen.getByRole('switch', { name: 'Reportes de errores' })).not.toBeChecked(),
    );
  });

  it('si no se pudo guardar, lo dice y el switch vuelve a su valor', async () => {
    const repository = makePrivacyRepository();
    repository.setPreference.mockRejectedValue(new AppError('server', 'El servidor tuvo un problema.'));
    await renderWithProviders(<PrivacyScreen onDeleteAccount={jest.fn()} />, setup(repository));

    await fireEvent(await screen.findByRole('switch', { name: 'Avisos de pedidos' }), 'valueChange', false);

    expect(await screen.findByText('El servidor tuvo un problema.')).toBeOnTheScreen();
    expect(screen.getByRole('switch', { name: 'Avisos de pedidos' })).toBeChecked();
  });

  it('ofrece eliminar la cuenta', async () => {
    const onDeleteAccount = jest.fn();
    await renderWithProviders(<PrivacyScreen onDeleteAccount={onDeleteAccount} />, setup());

    await fireEvent.press(await screen.findByRole('button', { name: 'Eliminar mi cuenta' }));

    expect(onDeleteAccount).toHaveBeenCalledTimes(1);
  });

  it('si no se pudo cargar, deja reintentar', async () => {
    const repository = makePrivacyRepository();
    repository.get.mockRejectedValueOnce(new AppError('network', 'Sin conexión'));
    await renderWithProviders(<PrivacyScreen onDeleteAccount={jest.fn()} />, setup(repository));

    await fireEvent.press(await screen.findByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('switch', { name: 'Avisos de pedidos' })).toBeOnTheScreen();
  });
});

describe('DeleteAccountScreen', () => {
  /** Simula que la persona elige el botón `index` del diálogo de confirmación. */
  const answerAlert = (index: number) =>
    jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons?: AlertButton[]) => buttons?.[index]?.onPress?.());

  afterEach(() => jest.restoreAllMocks());

  it('sin contraseña pide escribirla y no abre la confirmación', async () => {
    const alert = answerAlert(1);
    const deps = setup();
    await renderWithProviders(<DeleteAccountScreen />, deps);

    await fireEvent.press(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));

    expect(await screen.findByText('Escribe tu contraseña para confirmar.')).toBeOnTheScreen();
    expect(alert).not.toHaveBeenCalled();
    expect(deps.deleteAccountUseCase.execute).not.toHaveBeenCalled();
  });

  it('cancelar la confirmación no elimina nada', async () => {
    answerAlert(0);
    const deps = setup();
    await renderWithProviders(<DeleteAccountScreen />, deps);

    await fireEvent.changeText(screen.getByLabelText('Tu contraseña'), 'Prueba#2026');
    await fireEvent.press(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));

    expect(deps.deleteAccountUseCase.execute).not.toHaveBeenCalled();
    expect(deps.sessionStore.getState().status).toBe('authenticated');
  });

  it('al confirmar elimina la cuenta y vuelve al Login con el aviso', async () => {
    answerAlert(1);
    const deps = setup();
    const execute = jest.fn().mockResolvedValue(undefined);
    deps.deleteAccountUseCase = { execute };
    await renderWithProviders(<DeleteAccountScreen />, deps);

    await fireEvent.changeText(screen.getByLabelText('Tu contraseña'), 'Prueba#2026');
    await fireEvent.press(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));

    await waitFor(() => expect(deps.sessionStore.getState().status).toBe('unauthenticated'));
    expect(execute).toHaveBeenCalledWith('Prueba#2026');
    expect(deps.sessionStore.getState().notice).toBe('Tu cuenta se eliminó.');
  });

  it('enlaza al recurso web de eliminación (requisito de Google Play) sin romperse si no abre', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('sin navegador'));
    await renderWithProviders(<DeleteAccountScreen />, setup());

    await fireEvent.press(screen.getByRole('button', { name: 'Pedir la eliminación desde la web' }));

    expect(openURL).toHaveBeenCalledWith('https://el-quijote.vercel.app/eliminar-cuenta');
    expect(screen.getByRole('button', { name: 'Eliminar mi cuenta' })).toBeOnTheScreen();
  });

  it('si el servidor la rechaza muestra el motivo y la sesión sigue abierta', async () => {
    answerAlert(1);
    const deps = setup();
    deps.deleteAccountUseCase = {
      execute: jest.fn().mockRejectedValue(new AppError('validation', 'La contraseña no es correcta', 400)),
    };
    await renderWithProviders(<DeleteAccountScreen />, deps);

    await fireEvent.changeText(screen.getByLabelText('Tu contraseña'), 'mala');
    await fireEvent.press(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));

    expect(await screen.findByText('La contraseña no es correcta')).toBeOnTheScreen();
    expect(deps.sessionStore.getState().status).toBe('authenticated');
  });
});

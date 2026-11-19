/**
 * Integración de los derechos ARCO con datos de prueba: aviso con consentimiento explícito,
 * preferencias de exclusión y eliminación de la cuenta, contra el API falso.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import { testUsers } from '../../core/testing/data/testData';
import { createFakeApi } from '../../core/testing/fakeApi';
import { loginAs, startTestApp, tab } from '../../core/testing/startTestApp';

const openPrivacy = async () => {
  await fireEvent.press(tab('Perfil')!);
  await fireEvent.press(await screen.findByRole('button', { name: 'Privacidad' }));
};

describe('Integración: privacidad y derechos ARCO', () => {
  afterEach(() => jest.restoreAllMocks());

  it('en el primer inicio de sesión hay que aceptar el aviso para entrar, y queda registrado', async () => {
    const { api } = await startTestApp({ api: createFakeApi({ privacyNoticeAccepted: false }) });
    await loginAs(testUsers.mesero.email);

    expect(await screen.findByRole('header', { name: 'Aviso de privacidad' })).toBeOnTheScreen();
    expect(tab('Menú')).toBeNull();
    expect(screen.getByRole('button', { name: 'Aceptar y continuar' })).toBeDisabled();

    await fireEvent.press(screen.getByRole('checkbox'));
    await fireEvent.press(screen.getByRole('button', { name: 'Aceptar y continuar' }));

    await waitFor(() => expect(tab('Menú')).toBeOnTheScreen());
    const consent = api.requests.find((r) => r.method === 'PUT' && r.path === 'profile/privacidad');
    expect(consent?.body).toEqual({
      origen: 'movil',
      avisoPrivacidad: { aceptado: true, version: '2026-11' },
    });
  });

  it('quien no acepta el aviso vuelve al Login', async () => {
    await startTestApp({ api: createFakeApi({ privacyNoticeAccepted: false }) });
    await loginAs(testUsers.cocina.email);

    await fireEvent.press(await screen.findByRole('button', { name: 'No acepto, cerrar sesión' }));

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeOnTheScreen();
  });

  it('oposición: apagar los avisos de pedidos se guarda en el servidor', async () => {
    const { api } = await startTestApp();
    await loginAs(testUsers.cajero.email);
    await waitFor(() => expect(tab('Perfil')).toBeOnTheScreen());
    await openPrivacy();

    await fireEvent(await screen.findByRole('switch', { name: 'Avisos de pedidos' }), 'valueChange', false);

    await waitFor(() => expect(screen.getByRole('switch', { name: 'Avisos de pedidos' })).not.toBeChecked());
    const change = api.requests.filter((r) => r.method === 'PUT' && r.path === 'profile/privacidad').at(-1);
    expect(change?.body).toEqual({ origen: 'movil', notificacionesPush: false });
  });

  it('cancelación: eliminar la cuenta pide la contraseña, cierra la sesión y la cuenta ya no entra', async () => {
    jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons?: AlertButton[]) => buttons?.[1]?.onPress?.());
    const { api, storage } = await startTestApp();
    await loginAs(testUsers.mesero.email);
    await waitFor(() => expect(tab('Perfil')).toBeOnTheScreen());
    await openPrivacy();
    await fireEvent.press(await screen.findByRole('button', { name: 'Eliminar mi cuenta' }));

    await fireEvent.changeText(await screen.findByLabelText('Tu contraseña'), 'Incorrecta#1');
    await fireEvent.press(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));
    expect(await screen.findByText('La contraseña no es correcta')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Tu contraseña'), 'Prueba#2026');
    await fireEvent.press(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));

    expect(await screen.findByText('Tu cuenta se eliminó.')).toBeOnTheScreen();
    expect(storage.saved()).toBeNull();
    const removal = api.requests.filter((r) => r.method === 'DELETE' && r.path === 'account').at(-1);
    expect(removal?.body).toEqual({ password: 'Prueba#2026' });

    await loginAs(testUsers.mesero.email);
    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeOnTheScreen();
  });

  it('el único administrador no puede eliminar su cuenta y ve el motivo', async () => {
    jest
      .spyOn(Alert, 'alert')
      .mockImplementation((_title, _message, buttons?: AlertButton[]) => buttons?.[1]?.onPress?.());
    await startTestApp();
    await loginAs(testUsers.admin.email);
    await waitFor(() => expect(tab('Perfil')).toBeOnTheScreen());
    await openPrivacy();
    await fireEvent.press(await screen.findByRole('button', { name: 'Eliminar mi cuenta' }));

    await fireEvent.changeText(await screen.findByLabelText('Tu contraseña'), 'Prueba#2026');
    await fireEvent.press(screen.getByRole('button', { name: 'Eliminar mi cuenta' }));

    expect(await screen.findByText(/Eres el único administrador activo/)).toBeOnTheScreen();
    expect(tab('Perfil')).toBeOnTheScreen();
  });
});

import { fireEvent, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';

import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeSession } from '../../__fixtures__/auth';
import { ProfileScreen } from '../screens/ProfileScreen';

describe('ProfileScreen', () => {
  it('muestra nombre, rol, correo y la hora en que vence la sesión', async () => {
    const deps = makeTestDependencies();
    const session = makeSession({ expiresAt: new Date(2026, 9, 28, 21, 30).getTime() });
    session.user.role = 'admin';
    deps.sessionStore.getState().setSession(session);

    await renderWithProviders(<ProfileScreen />, deps);

    expect(screen.getByRole('header')).toHaveTextContent('Ana López');
    // Las iniciales son decorativas: están ocultas al lector de pantalla.
    expect(screen.getByText('AL', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(screen.getByText('Administrador')).toBeOnTheScreen();
    expect(screen.getByLabelText('Correo: ana@quijote.mx')).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Tu sesión vence: a las 09:30/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeOnTheScreen();
  });

  it('enlaza al aviso de privacidad y a eliminar la cuenta en la web (requisito de Google Play)', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const deps = makeTestDependencies();
    deps.sessionStore.getState().setSession(makeSession());

    await renderWithProviders(<ProfileScreen />, deps);

    await fireEvent.press(screen.getByRole('link', { name: 'Aviso de privacidad' }));
    expect(openURL).toHaveBeenLastCalledWith('https://el-quijote.vercel.app/privacidad');
    await fireEvent.press(screen.getByRole('link', { name: 'Eliminar cuenta' }));
    expect(openURL).toHaveBeenLastCalledWith('https://el-quijote.vercel.app/eliminar-cuenta');
    openURL.mockRestore();
  });

  it('si el teléfono no puede abrir el enlace, la pantalla sigue funcionando', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('sin navegador'));
    const deps = makeTestDependencies();
    deps.sessionStore.getState().setSession(makeSession());

    await renderWithProviders(<ProfileScreen />, deps);
    await fireEvent.press(screen.getByRole('link', { name: 'Eliminar cuenta' }));

    await expect(openURL.mock.results[0]?.value).rejects.toThrow('sin navegador');
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeOnTheScreen();
    openURL.mockRestore();
  });

  it('sin sesión no muestra nada', async () => {
    await renderWithProviders(<ProfileScreen />, makeTestDependencies());
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull();
  });
});

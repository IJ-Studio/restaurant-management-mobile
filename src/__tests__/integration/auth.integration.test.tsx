/**
 * Integración HU-01 con datos de prueba: Login real contra el API falso (src/core/testing/fakeApi.ts).
 * Recorre httpClient → AuthRemoteDataSource → sessionMapper → LoginUseCase → sesión → navegación.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { testUsers } from '../../core/testing/data/testData';
import { loginAs, startTestApp, tab } from '../../core/testing/startTestApp';

describe('Integración: inicio de sesión con datos de prueba', () => {
  it('el mesero entra y el menú llega del API con su token', async () => {
    const { api } = await startTestApp();

    await loginAs(testUsers.mesero.email);

    await waitFor(() => expect(tab('Menú')).toBeOnTheScreen());
    expect(await screen.findByText('Guacamole')).toBeOnTheScreen();
    // La categoría inactiva del API no se muestra.
    expect(screen.queryByText('Chiles en nogada')).toBeNull();

    const signIn = api.requests.find((r) => r.path === 'auth/sign-in');
    expect(signIn).toMatchObject({ method: 'POST', authorization: null });
    const menu = api.requests.find((r) => r.path === 'menu/categories/with-products');
    expect(menu?.authorization).toMatch(/^Bearer .+\..+\..+$/);
  });

  it('con una contraseña incorrecta muestra el mensaje genérico y no guarda sesión', async () => {
    const { storage } = await startTestApp();

    await loginAs(testUsers.mesero.email, 'Incorrecta#1');

    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeOnTheScreen();
    expect(storage.saved()).toBeNull();
  });

  it('la sesión guardada no incluye la contraseña ni columnas internas del usuario', async () => {
    const { storage } = await startTestApp();

    await loginAs(testUsers.cocina.email);

    await waitFor(() => expect(tab('Pedidos')).toBeOnTheScreen());
    const saved = JSON.stringify(storage.saved());
    expect(storage.saved()?.user).toEqual({
      id: '4',
      name: 'Diego',
      lastname: 'Luna',
      email: 'cocina@pruebas.quijote.mx',
      role: 'cocina',
    });
    expect(saved).not.toContain('password');
    expect(saved).not.toContain('loginAttempts');
  });

  it('al cerrar sesión avisa al API con el token y regresa al Login', async () => {
    const { api, storage } = await startTestApp();
    await loginAs(testUsers.cajero.email);

    await waitFor(() => expect(tab('Perfil')).toBeOnTheScreen());
    await fireEvent.press(tab('Perfil')!);
    await fireEvent.press(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('Iniciar sesión')).toBeOnTheScreen();
    const signOut = api.requests.find((r) => r.path === 'auth/sign-out');
    expect(signOut?.authorization).toMatch(/^Bearer /);
    expect(storage.saved()).toBeNull();
  });
});

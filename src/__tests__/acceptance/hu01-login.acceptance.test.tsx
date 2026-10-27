/**
 * Aceptación HU-01 Inicio de sesión del personal (#318).
 * Criterios: "un miembro del personal con credenciales válidas queda autenticado y su sesión sobrevive
 * a cerrar/abrir la app; credenciales inválidas muestran un mensaje de error claro."
 */
import { screen, waitFor } from '@testing-library/react-native';

import { FIRST_TAB, signInAs, visibleTabs, type StaffRole } from '../../core/testing/acceptance';
import { testUsers } from '../../core/testing/data/testData';
import { loginAs, startTestApp, tab } from '../../core/testing/startTestApp';

/** Pestañas que debe ver cada rol al entrar (HU-02). */
const TABS_BY_ROLE: Record<StaffRole, string[]> = {
  admin: ['Dashboard', 'Pedidos', 'Reservaciones', 'Menú', 'Perfil'],
  mesero: ['Menú', 'Pedidos', 'Reservaciones', 'Perfil'],
  cajero: ['Cobros', 'Pedidos', 'Perfil'],
  cocina: ['Pedidos', 'Perfil'],
};

describe('HU-01 Inicio de sesión del personal', () => {
  it.each(Object.keys(FIRST_TAB) as StaffRole[])(
    'HU-01 CA-1: con credenciales válidas %s queda autenticado y entra a su sección',
    async (role) => {
      // Arrange
      await startTestApp();

      // Act
      await signInAs(role);

      // Assert
      expect(screen.queryByText('Iniciar sesión')).toBeNull();
      expect(visibleTabs()).toEqual(TABS_BY_ROLE[role]);
    },
  );

  it('HU-01 CA-1: el mesero inicia sesión y ve el menú que llega del API', async () => {
    // Arrange
    await startTestApp();

    // Act
    await signInAs('mesero');

    // Assert
    expect(await screen.findByText('Guacamole')).toBeOnTheScreen();
  });

  it('HU-01 CA-2: la sesión sobrevive a cerrar y volver a abrir la app', async () => {
    // Arrange
    const first = await startTestApp();
    await signInAs('cocina');
    await first.unmount();

    // Act: se abre de nuevo la app en el mismo celular (mismo almacenamiento seguro, mismo servidor).
    await startTestApp({ api: first.api, storage: first.storage });

    // Assert: entra directo, sin pedir credenciales.
    await waitFor(() => expect(tab('Pedidos')).toBeOnTheScreen());
    expect(screen.queryByLabelText('Contraseña')).toBeNull();
  });

  it('HU-01 CA-3: con credenciales inválidas muestra un mensaje de error claro y no entra', async () => {
    // Arrange
    const { storage } = await startTestApp();

    // Act
    await loginAs(testUsers.mesero.email, 'Incorrecta#1');

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
    expect(tab('Menú')).toBeNull();
    expect(storage.saved()).toBeNull();
  });

  it('HU-01 CA-3: con un correo mal escrito explica qué corregir sin llamar al API', async () => {
    // Arrange
    const { api } = await startTestApp();

    // Act
    await loginAs('mesero-sin-arroba', 'Prueba#2026');

    // Assert
    expect(await screen.findByText('Ingresa un correo válido.')).toBeOnTheScreen();
    expect(api.requests.some((r) => r.path === 'auth/sign-in')).toBe(false);
  });
});

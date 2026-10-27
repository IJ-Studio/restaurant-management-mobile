/**
 * Aceptación HU-02 Navegación según rol (#323).
 * Criterio: "un rol operativo (ej. Mesero) no puede ver las pantallas exclusivas de otro rol
 * (ej. Administrador) y viceversa."
 */
import { fireEvent, screen } from '@testing-library/react-native';

import { openTab, signInAs, visibleTabs } from '../../core/testing/acceptance';
import { startTestApp, tab } from '../../core/testing/startTestApp';

describe('HU-02 Navegación según rol', () => {
  it('HU-02 CA-1: el mesero no ve el Dashboard del administrador ni los Cobros del cajero', async () => {
    // Arrange
    await startTestApp();

    // Act
    await signInAs('mesero');

    // Assert
    expect(tab('Dashboard')).toBeNull();
    expect(tab('Cobros')).toBeNull();
    expect(screen.queryByText('Indicadores del día (HU-08).')).toBeNull();
  });

  it('HU-02 CA-2: el administrador ve su Dashboard y no ve los Cobros exclusivos del cajero', async () => {
    // Arrange
    await startTestApp();

    // Act
    await signInAs('admin');

    // Assert
    expect(screen.getByText('Indicadores del día (HU-08).')).toBeOnTheScreen();
    expect(tab('Cobros')).toBeNull();
  });

  it('HU-02 CA-1: cocina solo ve Pedidos y Perfil, ninguna pantalla del administrador', async () => {
    // Arrange
    await startTestApp();

    // Act
    await signInAs('cocina');

    // Assert
    expect(visibleTabs()).toEqual(['Pedidos', 'Perfil']);
  });

  it('HU-02 CA-2: si el administrador cierra sesión y entra el cajero, no quedan pantallas del administrador', async () => {
    // Arrange
    await startTestApp();
    await signInAs('admin');

    // Act
    await openTab('Perfil');
    await fireEvent.press(await screen.findByRole('button', { name: 'Cerrar sesión' }));
    await signInAs('cajero');

    // Assert
    expect(visibleTabs()).toEqual(['Cobros', 'Pedidos', 'Perfil']);
    expect(tab('Dashboard')).toBeNull();
  });
});

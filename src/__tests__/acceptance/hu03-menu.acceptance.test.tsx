/**
 * Aceptación HU-03 Consultar el menú (#327).
 * Criterios: "la lista de platillos carga imágenes y disponibilidad reales de la API; el detalle
 * muestra la información completa de un platillo."
 */
import { fireEvent, screen } from '@testing-library/react-native';

import { imageUris, signInAs } from '../../core/testing/acceptance';
import { testMenu } from '../../core/testing/data/testData';
import { startTestApp } from '../../core/testing/startTestApp';

const activeDishes = testMenu.filter((c) => c.activa).flatMap((c) => c.platillos);

async function openMenuAsWaiter() {
  const app = await startTestApp();
  await signInAs('mesero');
  await screen.findByText('Guacamole');
  return app;
}

describe('HU-03 Consultar el menú', () => {
  it('HU-03 CA-1: la lista carga las imágenes que manda el API', async () => {
    // Arrange / Act
    await openMenuAsWaiter();

    // Assert
    expect(imageUris()).toEqual(activeDishes.map((d) => d.imagenUrl));
  });

  it('HU-03 CA-1: la lista muestra la disponibilidad real (agotado) y las categorías activas', async () => {
    // Arrange / Act
    await openMenuAsWaiter();

    // Assert
    expect(screen.getByRole('button', { name: 'Mole poblano, Agotado, $160.00' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Guacamole, $95.00' })).toBeOnTheScreen();
    expect(screen.getAllByRole('header').map((h) => h.props.children)).toEqual(
      expect.arrayContaining(['Entradas', 'Platos fuertes', 'Bebidas']),
    );
    expect(screen.queryByText('Temporada')).toBeNull();
  });

  it('HU-03 CA-2: el detalle muestra la información completa del platillo', async () => {
    // Arrange
    await openMenuAsWaiter();

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Enchiladas suizas, $145.50' }));

    // Assert
    expect(await screen.findByText('Enchiladas suizas de la casa.')).toBeOnTheScreen();
    expect(screen.getByText('Disponible')).toBeOnTheScreen();
    expect(screen.getByText('Tiempo de preparación: 15 min')).toBeOnTheScreen();
    expect(screen.getByText('Popular')).toBeOnTheScreen();
    expect(imageUris()).toContain('https://cdn.pruebas.quijote.mx/platillos/201.jpg');
  });

  it('HU-03 CA-2: el detalle de un platillo agotado lo indica y no deja agregarlo', async () => {
    // Arrange
    await openMenuAsWaiter();

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Mole poblano, Agotado, $160.00' }));

    // Assert
    expect(await screen.findByText('Agotado')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Agregar al pedido' })).toBeDisabled();
  });
});

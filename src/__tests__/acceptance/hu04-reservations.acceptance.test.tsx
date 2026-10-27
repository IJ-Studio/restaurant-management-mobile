/**
 * Aceptación HU-04 Registrar reservación de mesa (#331).
 * Criterios: "al crear una reservación válida, aparece de inmediato en el listado de reservaciones
 * activas; una reservación inválida no se envía y muestra el motivo."
 */
import { fireEvent, screen } from '@testing-library/react-native';

import { openTab, pickDateTime, signInAs, tomorrowAt } from '../../core/testing/acceptance';
import { startTestApp } from '../../core/testing/startTestApp';

async function openNewReservationAsWaiter() {
  const app = await startTestApp();
  await signInAs('mesero');
  await openTab('Reservaciones');
  await fireEvent.press(await screen.findByRole('button', { name: 'Nueva reservación' }));
  return app;
}

const reservationPosts = (app: Awaited<ReturnType<typeof startTestApp>>) =>
  app.api.requests.filter((r) => r.method === 'POST' && r.path === 'reservations');

describe('HU-04 Registrar reservación de mesa', () => {
  it('HU-04 CA-1: una reservación válida aparece de inmediato en el listado de activas', async () => {
    // Arrange
    const app = await openNewReservationAsWaiter();

    // Act
    await fireEvent.changeText(screen.getByLabelText('Nombre del cliente'), 'Laura Méndez');
    await fireEvent.changeText(screen.getByLabelText('Teléfono'), '55 1234 5678');
    await fireEvent.changeText(screen.getByLabelText('Correo'), 'laura@pruebas.quijote.mx');
    await pickDateTime(tomorrowAt(21));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar reservación' }));

    // Assert
    expect(await screen.findByText('Laura Méndez')).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent('Reservación registrada.');
    expect(screen.getByText('Cliente Prueba Uno')).toBeOnTheScreen();
    expect(reservationPosts(app)).toHaveLength(1);
  });

  it('HU-04 CA-2: un formulario incompleto no se envía y muestra el motivo de cada campo', async () => {
    // Arrange
    const app = await openNewReservationAsWaiter();

    // Act
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar reservación' }));

    // Assert
    expect(screen.getByText('Escribe el nombre del cliente (2 a 150 caracteres).')).toBeOnTheScreen();
    expect(screen.getByText('Escribe un teléfono válido (8 a 20 dígitos).')).toBeOnTheScreen();
    expect(screen.getByText('Elige la fecha y la hora.')).toBeOnTheScreen();
    expect(reservationPosts(app)).toHaveLength(0);
  });

  it('HU-04 CA-2: una reservación con fecha pasada no se envía y explica por qué', async () => {
    // Arrange
    const app = await openNewReservationAsWaiter();
    const yesterday = tomorrowAt(14);
    yesterday.setDate(yesterday.getDate() - 2);

    // Act
    await fireEvent.changeText(screen.getByLabelText('Nombre del cliente'), 'Laura Méndez');
    await fireEvent.changeText(screen.getByLabelText('Teléfono'), '55 1234 5678');
    await fireEvent.changeText(screen.getByLabelText('Correo'), 'laura@pruebas.quijote.mx');
    await pickDateTime(yesterday);
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar reservación' }));

    // Assert
    expect(screen.getByText('La fecha ya pasó.')).toBeOnTheScreen();
    expect(reservationPosts(app)).toHaveLength(0);
  });
});

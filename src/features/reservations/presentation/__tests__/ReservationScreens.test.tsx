import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '../../../../core/errors/AppError';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeReservation } from '../../__fixtures__/reservations';
import { ReservationsNavigator } from '../navigation/ReservationsNavigator';

// El selector nativo se reemplaza por un input: la prueba escribe la fecha en ISO.
jest.mock('@react-native-community/datetimepicker', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { TextInput } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: ({ mode, onChange }: { mode: string; onChange: (e: { type: string }, d?: Date) => void }) =>
      React.createElement(TextInput, {
        testID: `picker-${mode}`,
        onChangeText: (text: string) =>
          onChange({ type: text ? 'set' : 'dismissed' }, text ? new Date(text) : undefined),
      }),
  };
});

function tomorrowAt(hours: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hours, 0, 0, 0);
  return date;
}

function renderReservations(deps = makeTestDependencies()) {
  return renderWithProviders(
    <NavigationContainer>
      <ReservationsNavigator />
    </NavigationContainer>,
    deps,
  );
}

async function pickDateTime(date: Date) {
  await fireEvent.press(screen.getByRole('button', { name: 'Elegir fecha' }));
  await fireEvent.changeText(screen.getByTestId('picker-date'), date.toISOString());
  await fireEvent.press(screen.getByRole('button', { name: /^(Hora|Elegir hora)/ }));
  await fireEvent.changeText(screen.getByTestId('picker-time'), date.toISOString());
}

async function fillValidForm() {
  await fireEvent.changeText(screen.getByLabelText('Nombre del cliente'), 'Laura Méndez');
  await fireEvent.changeText(screen.getByLabelText('Teléfono'), '55 1234 5678');
  await fireEvent.changeText(screen.getByLabelText('Correo'), 'laura@correo.mx');
  await pickDateTime(tomorrowAt(20));
}

describe('Reservaciones', () => {
  it('lista las reservaciones activas con personas, mesa y estado', async () => {
    const deps = makeTestDependencies({
      listActiveReservationsUseCase: {
        execute: jest.fn().mockResolvedValue([
          makeReservation(),
          makeReservation({
            id: 'b',
            customerName: 'Pedro Ruiz',
            partySize: 1,
            tableId: undefined,
            status: 'pendiente',
          }),
        ]),
      },
    });
    await renderReservations(deps);

    expect(await screen.findByText('Laura Méndez')).toBeOnTheScreen();
    expect(screen.getByText('4 personas · Mesa 7 · Confirmada')).toBeOnTheScreen();
    expect(screen.getByText('1 persona · Sin mesa · Por confirmar')).toBeOnTheScreen();
  });

  it('avisa cuando no hay reservaciones y cuando el rol no tiene permiso', async () => {
    const execute = jest
      .fn()
      .mockRejectedValueOnce(new AppError('forbidden', 'Tu rol no tiene permiso para ver las reservaciones.'))
      .mockResolvedValue([]);
    await renderReservations(makeTestDependencies({ listActiveReservationsUseCase: { execute } }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu rol no tiene permiso para ver las reservaciones.',
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('No hay reservaciones activas.')).toBeOnTheScreen();
  });

  it('una reservación inválida no se envía y muestra los motivos', async () => {
    const deps = makeTestDependencies({
      listActiveReservationsUseCase: { execute: jest.fn().mockResolvedValue([]) },
    });
    await renderReservations(deps);
    await fireEvent.press(await screen.findByRole('button', { name: 'Nueva reservación' }));

    await fireEvent.changeText(screen.getByLabelText('Correo'), 'laura');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar reservación' }));

    expect(screen.getByText('Escribe el nombre del cliente (2 a 150 caracteres).')).toBeOnTheScreen();
    expect(screen.getByText('Escribe un correo válido.')).toBeOnTheScreen();
    expect(screen.getByText('Elige la fecha y la hora.')).toBeOnTheScreen();
    expect(deps.createReservationUseCase.execute).not.toHaveBeenCalled();
  });

  it('crea la reservación y aparece de inmediato en el listado', async () => {
    const created = makeReservation({ id: 'nueva', customerName: 'Laura Méndez' });
    const list = jest.fn().mockResolvedValueOnce([]).mockResolvedValue([created]);
    const create = jest.fn().mockResolvedValue({
      reservation: created,
      requiresConfirmation: true,
      message: 'Reserva creada. Confirma en 2 días.',
    });
    await renderReservations(
      makeTestDependencies({
        listActiveReservationsUseCase: { execute: list },
        createReservationUseCase: { execute: create },
      }),
    );

    await fireEvent.press(await screen.findByRole('button', { name: 'Nueva reservación' }));
    await fillValidForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Más personas' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'En persona' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar reservación' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Reserva creada. Confirma en 2 días.');
    expect(await screen.findByText('Laura Méndez')).toBeOnTheScreen();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: 'Laura Méndez',
        partySize: 3,
        channel: 'presencial',
        dateTime: tomorrowAt(20),
      }),
    );
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('muestra el motivo del API cuando no se puede reservar', async () => {
    const create = jest.fn().mockRejectedValue(new AppError('validation', 'No hay mesas disponibles'));
    await renderReservations(
      makeTestDependencies({
        listActiveReservationsUseCase: { execute: jest.fn().mockResolvedValue([]) },
        createReservationUseCase: { execute: create },
      }),
    );

    await fireEvent.press(await screen.findByRole('button', { name: 'Nueva reservación' }));
    await fillValidForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar reservación' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay mesas disponibles');
    expect(screen.getByLabelText('Nombre del cliente')).toHaveProp('value', 'Laura Méndez');
  });

  it('el número de personas se mantiene entre 1 y 50', async () => {
    await renderReservations(
      makeTestDependencies({ listActiveReservationsUseCase: { execute: jest.fn().mockResolvedValue([]) } }),
    );
    await fireEvent.press(await screen.findByRole('button', { name: 'Nueva reservación' }));

    for (let i = 0; i < 3; i++) await fireEvent.press(screen.getByRole('button', { name: 'Menos personas' }));
    expect(screen.getByLabelText('1 personas')).toBeOnTheScreen();

    for (let i = 0; i < 60; i++) await fireEvent.press(screen.getByRole('button', { name: 'Más personas' }));
    expect(screen.getByLabelText('50 personas')).toBeOnTheScreen();
  });

  it('cerrar el selector sin elegir no cambia la fecha', async () => {
    await renderReservations(
      makeTestDependencies({ listActiveReservationsUseCase: { execute: jest.fn().mockResolvedValue([]) } }),
    );
    await fireEvent.press(await screen.findByRole('button', { name: 'Nueva reservación' }));

    await fireEvent.press(screen.getByRole('button', { name: 'Elegir fecha' }));
    await fireEvent.changeText(screen.getByTestId('picker-date'), '');

    await waitFor(() => expect(screen.queryByTestId('picker-date')).toBeNull());
    expect(screen.getByRole('button', { name: 'Elegir fecha' })).toBeOnTheScreen();
  });

  it('sin reservaciones activas lleva a las recientes, con cualquier estatus', async () => {
    const recent = jest
      .fn()
      .mockResolvedValue([
        makeReservation({ id: 'r1', customerName: 'Paola Chávez', status: 'no_show', tableId: 5 }),
        makeReservation({
          id: 'r2',
          customerName: 'Raúl Vega',
          status: 'completada',
          occasion: 'Cumpleaños',
        }),
      ]);
    await renderReservations(
      makeTestDependencies({
        listActiveReservationsUseCase: { execute: jest.fn().mockResolvedValue([]) },
        listRecentReservationsUseCase: { execute: recent },
      }),
    );

    expect(await screen.findByText('No hay reservaciones activas.')).toBeOnTheScreen();
    expect(recent).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Ver las recientes' }));

    expect(await screen.findByText('Paola Chávez')).toBeOnTheScreen();
    expect(screen.getByText('4 personas · Mesa 5 · No se presentó')).toBeOnTheScreen();
    expect(screen.getByText('· Cumpleaños')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Recientes' })).toBeSelected();

    await fireEvent.press(screen.getByRole('radio', { name: 'Próximas' }));
    expect(await screen.findByText('No hay reservaciones activas.')).toBeOnTheScreen();
  });

  it('avisa cuando tampoco hubo reservaciones recientes', async () => {
    await renderReservations(
      makeTestDependencies({
        listActiveReservationsUseCase: { execute: jest.fn().mockResolvedValue([]) },
        listRecentReservationsUseCase: { execute: jest.fn().mockResolvedValue([]) },
      }),
    );
    await fireEvent.press(await screen.findByRole('radio', { name: 'Recientes' }));
    expect(await screen.findByText('No hubo reservaciones en los últimos 30 días.')).toBeOnTheScreen();
  });
});

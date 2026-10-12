import { NavigationContainer } from '@react-navigation/native';
import { QueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Dependencies } from '../../../../core/di/dependencies';
import { AppError } from '../../../../core/errors/AppError';
import { AppProviders } from '../../../../core/providers/AppProviders';
import type { Reservation } from '../../domain/entities/Reservation';
import { ReservationsStack } from '../navigation/ReservationsStack';

const testQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });

const existing: Reservation = {
  id: '1',
  customerName: 'Luis Gómez',
  customerPhone: '5511112222',
  dateTime: new Date(2099, 0, 10, 14, 0),
  partySize: 1,
  status: 'confirmada',
  tableId: 3,
  notes: '',
};

async function renderReservations(list: jest.Mock, create: jest.Mock = jest.fn()) {
  const dependencies = {
    getActiveReservationsUseCase: { execute: list },
    createReservationUseCase: { execute: create },
  } as unknown as Dependencies;
  await render(
    <AppProviders dependencies={dependencies} queryClient={testQueryClient()}>
      <NavigationContainer>
        <ReservationsStack />
      </NavigationContainer>
    </AppProviders>,
  );
  return { list, create };
}

describe('ReservationsScreen', () => {
  it('lista las reservaciones activas', async () => {
    await renderReservations(
      jest.fn().mockResolvedValue([existing, { ...existing, id: '2', customerName: 'Ana', partySize: 6, status: 'pendiente', notes: 'Terraza' }]),
    );

    expect(await screen.findByText('Luis Gómez')).toBeOnTheScreen();
    expect(screen.getByText('1 persona')).toBeOnTheScreen();
    expect(screen.getByText('6 personas · Terraza')).toBeOnTheScreen();
    expect(screen.getByText('Confirmada')).toBeOnTheScreen();
    expect(screen.getByText('Por confirmar')).toBeOnTheScreen();
  });

  it('avisa si no hay reservaciones', async () => {
    await renderReservations(jest.fn().mockResolvedValue([]));
    expect(await screen.findByText('No hay reservaciones activas.')).toBeOnTheScreen();
  });

  it('muestra el error del listado y deja crear una reservación', async () => {
    await renderReservations(
      jest.fn().mockRejectedValue(new AppError('forbidden', 'Tu rol todavía no puede ver el listado de reservaciones.')),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(/Tu rol todavía no puede ver el listado/);
    expect(screen.getByText('Nueva reservación')).toBeOnTheScreen();
  });
});

describe('ReservationFormScreen', () => {
  async function openForm(list: jest.Mock, create: jest.Mock) {
    await renderReservations(list, create);
    await fireEvent.press(await screen.findByText('Nueva reservación'));
    await screen.findByLabelText('Nombre del comensal');
  }

  async function fill(values: Record<string, string>) {
    for (const [label, value] of Object.entries(values)) {
      await fireEvent.changeText(screen.getByLabelText(label), value);
    }
  }

  const validValues = {
    'Nombre del comensal': 'María Pérez',
    Teléfono: '5512345678',
    Correo: 'maria@correo.mx',
    Fecha: '2099-01-10',
    Hora: '20:00',
    Personas: '4',
  };

  it('una reservación inválida no se envía y muestra el motivo', async () => {
    const create = jest.fn();
    await openForm(jest.fn().mockResolvedValue([]), create);

    await fill({ ...validValues, Fecha: '2020-01-01', Personas: '0' });
    await fireEvent.press(screen.getByText('Guardar reservación'));

    expect(await screen.findByText('La fecha ya pasó.')).toBeOnTheScreen();
    expect(screen.getByText('Debe haber al menos 1 persona.')).toBeOnTheScreen();
    expect(create).not.toHaveBeenCalled();
  });

  it('el error de un campo se quita al corregirlo', async () => {
    await openForm(jest.fn().mockResolvedValue([]), jest.fn());
    await fireEvent.press(screen.getByText('Guardar reservación'));
    expect(await screen.findByText('Escribe el nombre del comensal (2 a 150 letras).')).toBeOnTheScreen();

    await fill({ 'Nombre del comensal': 'María' });
    expect(screen.queryByText('Escribe el nombre del comensal (2 a 150 letras).')).toBeNull();
  });

  it('al crear una reservación válida aparece de inmediato en el listado', async () => {
    const created: Reservation = { ...existing, id: '9', customerName: 'María Pérez', partySize: 4, status: 'pendiente' };
    const list = jest.fn().mockResolvedValueOnce([existing]).mockResolvedValue([existing, created]);
    const create = jest.fn().mockResolvedValue(created);
    await openForm(list, create);

    await fill(validValues);
    await fireEvent.press(screen.getByText('Guardar reservación'));

    expect(await screen.findByText('María Pérez')).toBeOnTheScreen();
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ customerName: 'María Pérez', partySize: '4' }));
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('muestra el error del API (p. ej. sin mesas disponibles)', async () => {
    const create = jest.fn().mockRejectedValue(new AppError('validation', 'No hay mesas disponibles', 400));
    await openForm(jest.fn().mockResolvedValue([]), create);

    await fill(validValues);
    await fireEvent.press(screen.getByText('Guardar reservación'));

    expect(await screen.findByRole('alert')).toHaveTextContent('No hay mesas disponibles');
  });
});

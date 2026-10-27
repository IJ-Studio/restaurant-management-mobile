import { screen } from '@testing-library/react-native';
import { measureRenders } from 'reassure';

import { makeReservations } from '../core/testing/data/loadData';
import { toReservation } from '../features/reservations/data/mappers/reservationMapper';
import { ReservationsNavigator } from '../features/reservations/presentation/navigation/ReservationsNavigator';
import { makeWrapper, resolved } from '../core/testing/perf';

// Día lleno: 60 reservaciones activas.
const reservations = makeReservations(60).map(toReservation);

describe('Rendimiento: Reservaciones', () => {
  it('carga del listado de reservaciones activas', async () => {
    // Arrange
    const wrapper = makeWrapper({ listActiveReservationsUseCase: resolved(reservations) });
    const scenario = async () => {
      await screen.findByText('Cliente Carga 1');
    };

    // Act / Assert
    await measureRenders(<ReservationsNavigator />, { wrapper, scenario });
  });
});

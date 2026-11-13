import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppError } from '../../../../core/errors/AppError';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import type { ReservationsStackParamList } from '../navigation/ReservationsNavigator';
import { ReservationStatusScreen } from '../screens/ReservationStatusScreen';

const Stack = createNativeStackNavigator<ReservationsStackParamList>();

function ListProbe({ route }: { route: { params?: { notice?: string } } }) {
  return <Text>{route.params?.notice ?? 'lista'}</Text>;
}

async function renderStatus(execute: jest.Mock, status = 'pendiente') {
  const deps = makeTestDependencies({ changeReservationStatusUseCase: { execute } });
  await renderWithProviders(
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ReservationStatus">
        <Stack.Screen name="ReservationsList" component={ListProbe} />
        <Stack.Screen
          name="ReservationStatus"
          component={ReservationStatusScreen}
          initialParams={{ id: 'r-1', customerName: 'Laura Méndez', status, summary: '3 personas · Mesa 2' }}
        />
      </Stack.Navigator>
    </NavigationContainer>,
    deps,
  );
}

describe('ReservationStatusScreen', () => {
  it('muestra los cinco estados de la web y no deja guardar sin cambios', async () => {
    await renderStatus(jest.fn());

    expect(screen.getByRole('header')).toHaveTextContent('Estado de Laura Méndez');
    for (const label of ['Pendiente', 'Confirmada', 'Completada', 'Cancelada', 'No se presentó']) {
      expect(screen.getByRole('radio', { name: label })).toBeOnTheScreen();
    }
    expect(screen.getByRole('button', { name: 'Guardar estado' })).toBeDisabled();
  });

  it('confirma y vuelve al listado con el aviso', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    await renderStatus(execute);

    await fireEvent.press(screen.getByRole('radio', { name: 'Confirmada' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar estado' }));

    expect(await screen.findByText('Estado guardado: Confirmada')).toBeOnTheScreen();
    expect(execute).toHaveBeenCalledWith('r-1', 'confirmada', '');
  });

  it('al cancelar pide el motivo antes de enviar', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    await renderStatus(execute);

    await fireEvent.press(screen.getByRole('radio', { name: 'Cancelada' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar estado' }));
    expect(screen.getByText('Escribe el motivo de la cancelación.')).toBeOnTheScreen();
    expect(execute).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Motivo de la cancelación'), 'No llegó el grupo');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar estado' }));

    expect(execute).toHaveBeenCalledWith('r-1', 'cancelada', 'No llegó el grupo');
  });

  it('si el API rechaza muestra el motivo', async () => {
    const execute = jest
      .fn()
      .mockRejectedValue(
        new AppError('forbidden', 'Solo el administrador puede cambiar el estado de una reservación.'),
      );
    await renderStatus(execute);

    await fireEvent.press(screen.getByRole('radio', { name: 'Completada' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar estado' }));

    expect(
      await screen.findByText('Solo el administrador puede cambiar el estado de una reservación.'),
    ).toBeOnTheScreen();
  });
});

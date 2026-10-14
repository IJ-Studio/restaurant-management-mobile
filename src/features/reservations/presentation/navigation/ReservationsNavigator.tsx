import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { NewReservationScreen } from '../screens/NewReservationScreen';
import { ReservationsScreen } from '../screens/ReservationsScreen';

export type ReservationsStackParamList = {
  ReservationsList: { notice?: string } | undefined;
  NewReservation: undefined;
};

const Stack = createNativeStackNavigator<ReservationsStackParamList>();

export function ReservationsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ReservationsList"
        component={ReservationsScreen}
        options={{ title: 'Reservaciones' }}
      />
      <Stack.Screen
        name="NewReservation"
        component={NewReservationScreen}
        options={{ title: 'Nueva reservación' }}
      />
    </Stack.Navigator>
  );
}

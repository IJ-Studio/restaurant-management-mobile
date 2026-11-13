import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { stackScreenOptions } from '../../../../core/navigation/navigationTheme';
import { NewReservationScreen } from '../screens/NewReservationScreen';
import { ReservationsScreen } from '../screens/ReservationsScreen';
import { ReservationStatusScreen } from '../screens/ReservationStatusScreen';

export type ReservationsStackParamList = {
  ReservationsList: { notice?: string } | undefined;
  NewReservation: undefined;
  ReservationStatus: {
    id: string;
    customerName: string;
    status: string;
    summary: string;
    /** Para escribir al cliente (Fase 4.6). */
    when?: string;
    phone?: string;
    email?: string;
  };
};

const Stack = createNativeStackNavigator<ReservationsStackParamList>();

export function ReservationsNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
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
      <Stack.Screen
        name="ReservationStatus"
        component={ReservationStatusScreen}
        options={{ title: 'Cambiar estado' }}
      />
    </Stack.Navigator>
  );
}

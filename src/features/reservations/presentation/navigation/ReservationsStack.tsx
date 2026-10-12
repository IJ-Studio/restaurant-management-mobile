import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ReservationFormScreen } from '../screens/ReservationFormScreen';
import { ReservationsScreen } from '../screens/ReservationsScreen';

export type ReservationsStackParamList = {
  ReservationList: undefined;
  ReservationForm: undefined;
};

const Stack = createNativeStackNavigator<ReservationsStackParamList>();

export function ReservationsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ReservationList" component={ReservationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ReservationForm" component={ReservationFormScreen} options={{ title: 'Nueva reservación' }} />
    </Stack.Navigator>
  );
}

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { stackScreenOptions } from '../../../../core/navigation/navigationTheme';
import { ChargeListScreen } from '../screens/ChargeListScreen';
import { ChargeScreen } from '../screens/ChargeScreen';

export type CheckoutStackParamList = {
  ChargeList: undefined;
  Charge: { orderId: string; place: string };
};

const Stack = createNativeStackNavigator<CheckoutStackParamList>();

/** Cobros del cajero (HU-05): cuentas por cobrar → cobro en efectivo o terminal. */
export function CheckoutNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="ChargeList" component={ChargeListScreen} options={{ title: 'Cobros' }} />
      <Stack.Screen
        name="Charge"
        component={ChargeScreen}
        options={({ route }) => ({ title: `Cobrar · ${route.params.place}` })}
      />
    </Stack.Navigator>
  );
}

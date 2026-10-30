import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { stackScreenOptions } from '../../../../core/navigation/navigationTheme';
import { HeaderButton } from '../../../../shared/presentation/components/HeaderButton';
import { CashRegisterScreen } from '../../../cashier/presentation/CashRegisterScreen';
import { ChargeListScreen } from '../screens/ChargeListScreen';
import { ChargeScreen } from '../screens/ChargeScreen';

export type CheckoutStackParamList = {
  ChargeList: undefined;
  Charge: { orderId: string; place: string };
  CashRegister: undefined;
};

const Stack = createNativeStackNavigator<CheckoutStackParamList>();

/** Cobros del cajero (HU-05): cuentas por cobrar → cobro (con cuenta separada) y corte de caja. */
export function CheckoutNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="ChargeList"
        component={ChargeListScreen}
        options={({ navigation }) => ({
          title: 'Cobros',
          headerRight: () => (
            <HeaderButton
              label="Caja"
              icon="wallet-outline"
              accessibilityLabel="Corte de caja"
              onPress={() => navigation.navigate('CashRegister')}
            />
          ),
        })}
      />
      <Stack.Screen
        name="Charge"
        component={ChargeScreen}
        options={({ route }) => ({ title: `Cobrar · ${route.params.place}` })}
      />
      <Stack.Screen name="CashRegister" component={CashRegisterScreen} options={{ title: 'Corte de caja' }} />
    </Stack.Navigator>
  );
}

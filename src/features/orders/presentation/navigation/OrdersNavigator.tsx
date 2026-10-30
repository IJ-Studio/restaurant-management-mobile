import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { stackScreenOptions } from '../../../../core/navigation/navigationTheme';
import { ChargeScreen } from '../screens/ChargeScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { OrdersScreen } from '../screens/OrdersScreen';

export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: { orderId: string; place: string };
  Charge: { orderId: string; place: string };
};

const Stack = createNativeStackNavigator<OrdersStackParamList>();

/** Pedidos activos del día → detalle con acciones según el rol → cobro (HU-06). */
export function OrdersNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="OrdersList" component={OrdersScreen} options={{ title: 'Pedidos' }} />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={({ route }) => ({ title: `Pedido · ${route.params.place}` })}
      />
      <Stack.Screen
        name="Charge"
        component={ChargeScreen}
        options={({ route }) => ({ title: `Cobrar · ${route.params.place}` })}
      />
    </Stack.Navigator>
  );
}

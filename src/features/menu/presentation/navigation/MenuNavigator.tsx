import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CurrentOrderButton } from '../../../orders/presentation/components/CurrentOrderButton';
import { TableOrderScreen } from '../../../orders/presentation/screens/TableOrderScreen';
import { DishDetailScreen } from '../screens/DishDetailScreen';
import { MenuScreen } from '../screens/MenuScreen';

export type MenuStackParamList = {
  MenuList: undefined;
  DishDetail: { dishId: number; name: string };
  TableOrder: undefined;
};

const Stack = createNativeStackNavigator<MenuStackParamList>();

/** Menú → detalle → pedido de la mesa (HU-03 + HU-05). */
export function MenuNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerRight: () => <CurrentOrderButton onPress={() => navigation.navigate('TableOrder')} />,
      })}
    >
      <Stack.Screen name="MenuList" component={MenuScreen} options={{ title: 'Menú' }} />
      <Stack.Screen
        name="DishDetail"
        component={DishDetailScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <Stack.Screen
        name="TableOrder"
        component={TableOrderScreen}
        options={{ title: 'Pedido de la mesa', headerRight: undefined }}
      />
    </Stack.Navigator>
  );
}

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DishDetailScreen } from '../screens/DishDetailScreen';
import { MenuScreen } from '../screens/MenuScreen';

export type MenuStackParamList = {
  MenuList: undefined;
  DishDetail: { dishId: number; name: string };
};

const Stack = createNativeStackNavigator<MenuStackParamList>();

export function MenuNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MenuList" component={MenuScreen} options={{ title: 'Menú' }} />
      <Stack.Screen
        name="DishDetail"
        component={DishDetailScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
    </Stack.Navigator>
  );
}

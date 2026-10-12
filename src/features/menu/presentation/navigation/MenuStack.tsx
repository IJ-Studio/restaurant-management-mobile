import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DishDetailScreen } from '../screens/DishDetailScreen';
import { MenuScreen } from '../screens/MenuScreen';

export type MenuStackParamList = {
  MenuList: undefined;
  DishDetail: { id: string; name?: string };
};

const Stack = createNativeStackNavigator<MenuStackParamList>();

export function MenuStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MenuList" component={MenuScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="DishDetail"
        component={DishDetailScreen}
        options={({ route }) => ({ title: route.params.name ?? 'Platillo' })}
      />
    </Stack.Navigator>
  );
}

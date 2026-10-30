import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { stackScreenOptions } from '../../../../core/navigation/navigationTheme';
import { HeaderButton } from '../../../../shared/presentation/components/HeaderButton';
import { useSession } from '../../../auth/presentation/viewmodels/useSession';
import { KitchenReportsScreen } from '../../../kitchen/presentation/KitchenReportsScreen';
import { ReportIncidentScreen } from '../../../kitchen/presentation/ReportIncidentScreen';
import { ReportWasteScreen } from '../../../kitchen/presentation/ReportWasteScreen';
import { ChargeScreen } from '../screens/ChargeScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { OrdersScreen } from '../screens/OrdersScreen';

export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: { orderId: string; place: string };
  Charge: { orderId: string; place: string };
  KitchenReports: undefined;
  ReportIncident: { orderId?: string; place?: string } | undefined;
  ReportWaste: undefined;
};

const Stack = createNativeStackNavigator<OrdersStackParamList>();

/** Acceso a incidencias y mermas: lo ven cocina y el administrador. */
function ReportsButton() {
  const role = useSession((state) => state.session?.user.role);
  const navigation = useNavigation<NativeStackNavigationProp<OrdersStackParamList>>();
  if (role !== 'cocina' && role !== 'admin') return null;
  return (
    <HeaderButton
      label="Reportes"
      icon="clipboard-outline"
      accessibilityLabel="Incidencias y mermas"
      onPress={() => navigation.navigate('KitchenReports')}
    />
  );
}

/** Pedidos activos del día → detalle con acciones según el rol → cobro (HU-06). */
export function OrdersNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="OrdersList"
        component={OrdersScreen}
        options={{ title: 'Pedidos', headerRight: () => <ReportsButton /> }}
      />
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
      <Stack.Screen
        name="KitchenReports"
        component={KitchenReportsScreen}
        options={{ title: 'Incidencias y mermas' }}
      />
      <Stack.Screen
        name="ReportIncident"
        component={ReportIncidentScreen}
        options={{ title: 'Reportar incidencia' }}
      />
      <Stack.Screen name="ReportWaste" component={ReportWasteScreen} options={{ title: 'Registrar merma' }} />
    </Stack.Navigator>
  );
}

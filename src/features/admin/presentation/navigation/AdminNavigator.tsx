import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { stackScreenOptions } from '../../../../core/navigation/navigationTheme';
import { Button } from '../../../../shared/presentation/components/Button';
import { spacing } from '../../../../shared/presentation/theme';
import { InvoicesScreen } from '../../invoices/presentation/InvoicesScreen';
import { PayrollEmployeesScreen } from '../../payroll/presentation/PayrollEmployeesScreen';
import { PayrollScreen } from '../../payroll/presentation/PayrollScreen';
import { StaffScreen } from '../../staff/presentation/StaffScreen';
import { TablesScreen } from '../../tables/presentation/TablesScreen';
import { DashboardScreen } from '../screens/DashboardScreen';

export type AdminStackParamList = {
  AdminHome: undefined;
  Payroll: undefined;
  PayrollEmployees: undefined;
  Tables: undefined;
  Staff: undefined;
  Invoices: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

/** Inicio del admin: el panel y el acceso a los módulos de administración. */
function AdminHome() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  return (
    <View style={styles.home}>
      <View style={styles.modules}>
        <Button label="Nómina" variant="outline" onPress={() => navigation.navigate('Payroll')} />
        <Button
          label="Empleados de la nómina"
          variant="outline"
          onPress={() => navigation.navigate('PayrollEmployees')}
        />
        <Button label="Mesas" variant="outline" onPress={() => navigation.navigate('Tables')} />
        <Button label="Personal" variant="outline" onPress={() => navigation.navigate('Staff')} />
        <Button label="Facturas" variant="outline" onPress={() => navigation.navigate('Invoices')} />
      </View>
      <DashboardScreen />
    </View>
  );
}

/** Administración → inicio y módulos (nómina, mesas y personal; los demás se añaden aquí). */
export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="AdminHome" component={AdminHome} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="Payroll" component={PayrollScreen} options={{ title: 'Nómina' }} />
      <Stack.Screen
        name="PayrollEmployees"
        component={PayrollEmployeesScreen}
        options={{ title: 'Empleados de la nómina' }}
      />
      <Stack.Screen name="Tables" component={TablesScreen} options={{ title: 'Mesas' }} />
      <Stack.Screen name="Staff" component={StaffScreen} options={{ title: 'Personal' }} />
      <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Facturas' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  home: { flex: 1 },
  modules: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});

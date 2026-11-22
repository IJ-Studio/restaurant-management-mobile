import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { stackScreenOptions } from '../../../../core/navigation/navigationTheme';
import { HeaderButton } from '../../../../shared/presentation/components/HeaderButton';
import { spacing } from '../../../../shared/presentation/theme';
import { PromotionsScreen } from '../../promotions/presentation/PromotionsScreen';
import { StockScreen } from '../../stock/presentation/StockScreen';
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
  Promotions: undefined;
  Stock: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

/** Inicio del admin: el panel y el acceso a los módulos de administración. */
function AdminHome() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  return (
    <View style={styles.home}>
      <View style={styles.modules}>
        <HeaderButton label="Nómina" style={styles.module} onPress={() => navigation.navigate('Payroll')} />
        <HeaderButton
          label="Empleados de la nómina"
          style={styles.module}
          onPress={() => navigation.navigate('PayrollEmployees')}
        />
        <HeaderButton label="Mesas" style={styles.module} onPress={() => navigation.navigate('Tables')} />
        <HeaderButton label="Personal" style={styles.module} onPress={() => navigation.navigate('Staff')} />
        <HeaderButton
          label="Facturas"
          style={styles.module}
          onPress={() => navigation.navigate('Invoices')}
        />
        <HeaderButton
          label="Promociones"
          style={styles.module}
          onPress={() => navigation.navigate('Promotions')}
        />
        <HeaderButton
          label="Existencias"
          style={styles.module}
          onPress={() => navigation.navigate('Stock')}
        />
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
      <Stack.Screen name="Promotions" component={PromotionsScreen} options={{ title: 'Promociones' }} />
      <Stack.Screen name="Stock" component={StockScreen} options={{ title: 'Existencias' }} />
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
  // Cada acceso crece para llenar su fila: en 390 px quedan filas de 2, 3 y 2 como en el diseño.
  module: { flexGrow: 1 },
});

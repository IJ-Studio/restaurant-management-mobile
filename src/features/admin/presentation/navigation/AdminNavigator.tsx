import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { stackScreenOptions } from '../../../../core/navigation/navigationTheme';
import { Button } from '../../../../shared/presentation/components/Button';
import { spacing } from '../../../../shared/presentation/theme';
import { PayrollScreen } from '../../payroll/presentation/PayrollScreen';
import { TablesScreen } from '../../tables/presentation/TablesScreen';
import { DashboardScreen } from '../screens/DashboardScreen';

export type AdminStackParamList = {
  AdminHome: undefined;
  Payroll: undefined;
  Tables: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

/** Inicio del admin: el panel y el acceso a los módulos de administración. */
function AdminHome() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  return (
    <View style={styles.home}>
      <View style={styles.modules}>
        <Button label="Nómina" variant="outline" onPress={() => navigation.navigate('Payroll')} />
        <Button label="Mesas" variant="outline" onPress={() => navigation.navigate('Tables')} />
      </View>
      <DashboardScreen />
    </View>
  );
}

/** Administración → inicio y módulos (nómina y mesas; los demás se añaden aquí). */
export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="AdminHome" component={AdminHome} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="Payroll" component={PayrollScreen} options={{ title: 'Nómina' }} />
      <Stack.Screen name="Tables" component={TablesScreen} options={{ title: 'Mesas' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  home: { flex: 1 },
  modules: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
});

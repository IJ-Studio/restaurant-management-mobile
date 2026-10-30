import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState } from '../../../../shared/presentation/components/EmptyState';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { StatCard } from '../../../../shared/presentation/components/StatCard';
import { colors, spacing } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import { OrderCard } from '../components/OrderCard';
import type { CheckoutStackParamList } from '../navigation/CheckoutNavigator';
import { useChargeableOrders } from '../viewmodels/useChargeableOrders';

/** Cobros (cajero): pedidos por cobrar, los ya entregados primero. */
export function ChargeListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CheckoutStackParamList>>();
  const vm = useChargeableOrders();

  if (vm.isLoading) return <LoadingState message="Cargando cuentas…" />;
  if (vm.errorMessage && !vm.hasData) return <ErrorState message={vm.errorMessage} onRetry={vm.refresh} />;

  const now = new Date();

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={vm.orders}
      keyExtractor={(order) => order.id}
      ListHeaderComponent={
        <>
          {vm.errorMessage && (
            <Notice message={`No se pudo actualizar: ${vm.errorMessage}`} style={styles.notice} />
          )}
          <View style={styles.stats}>
            <StatCard
              label="Por cobrar"
              value={formatCurrency(vm.pendingTotal)}
              icon="wallet-outline"
              tone="brand"
              style={styles.stat}
            />
            <StatCard
              label="Cuentas abiertas"
              value={String(vm.orders.length)}
              icon="receipt-outline"
              style={styles.stat}
            />
          </View>
        </>
      }
      renderItem={({ item }) => (
        <OrderCard
          order={item}
          now={now}
          onPress={() => navigation.navigate('Charge', { orderId: item.id, place: item.place })}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={<EmptyState message="No hay cuentas por cobrar." />}
      refreshControl={
        <RefreshControl
          refreshing={vm.isRefreshing}
          tintColor={colors.brand}
          onRefresh={async () => {
            await vm.refresh();
          }}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, flexGrow: 1 },
  notice: { marginBottom: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  stat: { flex: 1 },
  separator: { height: spacing.md },
});

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from '../../../../shared/presentation/components/Chip';
import { EmptyState } from '../../../../shared/presentation/components/EmptyState';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { colors, spacing } from '../../../../shared/presentation/theme';
import { ACTION_LABEL } from '../components/orderLabels';
import { OrderCard } from '../components/OrderCard';
import type { OrdersStackParamList } from '../navigation/OrdersNavigator';
import { incidentSummary, useIncidents } from '../../../kitchen/presentation/viewmodels';
import { useActiveOrders } from '../viewmodels/useActiveOrders';

export function OrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OrdersStackParamList>>();
  const vm = useActiveOrders();
  const { byOrder } = useIncidents();

  if (vm.isLoading) return <LoadingState message="Cargando pedidos…" />;
  if (vm.errorMessage && !vm.hasData) return <ErrorState message={vm.errorMessage} onRetry={vm.refresh} />;

  const now = new Date();
  const emptyMessage = vm.kitchen
    ? 'No hay pedidos en cocina. ¡Todo al día!'
    : 'No hay pedidos en este filtro.';

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersBar}
        contentContainerStyle={styles.filters}
        accessibilityRole="radiogroup"
      >
        {vm.filters.map((option) => (
          <Chip
            key={option.key}
            label={option.label}
            count={vm.counts[option.key]}
            selected={vm.filter === option.key}
            onPress={() => vm.setFilter(option.key)}
          />
        ))}
      </ScrollView>
      <FlatList
        data={vm.orders}
        keyExtractor={(order) => order.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {vm.errorMessage && (
              <Notice message={`No se pudo actualizar: ${vm.errorMessage}`} style={styles.notice} />
            )}
            {vm.actionError && <Notice message={vm.actionError} style={styles.notice} />}
            {vm.notice && <Notice tone="success" message={vm.notice} style={styles.notice} />}
          </>
        }
        renderItem={({ item }) => {
          const quick = vm.quickActionFor(item);
          return (
            <OrderCard
              order={item}
              now={now}
              showAllItems={vm.kitchen}
              alert={byOrder.get(item.id) ? incidentSummary(byOrder.get(item.id)!) : undefined}
              onPress={
                vm.canOpen
                  ? () => navigation.navigate('OrderDetail', { orderId: item.id, place: item.place })
                  : undefined
              }
              action={
                quick
                  ? {
                      label: ACTION_LABEL[quick],
                      onPress: () => vm.runQuickAction(item),
                      loading: vm.busyOrderId === item.id,
                    }
                  : undefined
              }
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState message={emptyMessage} icon={vm.kitchen ? 'flame-outline' : 'receipt-outline'} />
        }
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filtersBar: { flexGrow: 0 },
  filters: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  list: { padding: spacing.lg, paddingTop: 0, flexGrow: 1 },
  notice: { marginBottom: spacing.md },
  separator: { height: spacing.md },
});

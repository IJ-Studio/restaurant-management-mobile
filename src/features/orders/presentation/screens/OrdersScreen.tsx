import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from '../../../../shared/presentation/components/Chip';
import { EmptyState } from '../../../../shared/presentation/components/EmptyState';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { colors, spacing } from '../../../../shared/presentation/theme';
import { OrderCard } from '../components/OrderCard';
import type { OrdersStackParamList } from '../navigation/OrdersNavigator';
import { useActiveOrders, type OrderFilter } from '../viewmodels/useActiveOrders';

const FILTERS: { value: OrderFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pendiente', label: 'Por confirmar' },
  { value: 'abierta', label: 'En cocina' },
];

const EMPTY_MESSAGE: Record<OrderFilter, string> = {
  all: 'No hay pedidos activos hoy.',
  pendiente: 'No hay pedidos por confirmar.',
  abierta: 'No hay pedidos en cocina.',
};

export function OrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OrdersStackParamList>>();
  const vm = useActiveOrders();

  if (vm.isLoading) return <LoadingState message="Cargando pedidos…" />;
  if (vm.errorMessage && !vm.hasData) return <ErrorState message={vm.errorMessage} onRetry={vm.refresh} />;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersBar}
        contentContainerStyle={styles.filters}
        accessibilityRole="radiogroup"
      >
        {FILTERS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            count={vm.counts[option.value]}
            selected={vm.filter === option.value}
            onPress={() => vm.setFilter(option.value)}
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
            {!vm.canManage && (
              <Notice
                tone="info"
                message="Vista de cocina: los pedidos se actualizan solos cada 30 segundos."
                style={styles.notice}
              />
            )}
          </>
        }
        renderItem={({ item }) => {
          const { tableNumber } = item;
          const open =
            vm.canManage && tableNumber !== undefined
              ? () => navigation.navigate('OrderDetail', { orderId: item.id, tableNumber, place: item.place })
              : undefined;
          return <OrderCard order={item} onPress={open} />;
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState message={EMPTY_MESSAGE[vm.filter]} />}
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

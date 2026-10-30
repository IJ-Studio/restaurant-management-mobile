import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { SectionTitle } from '../../../../shared/presentation/components/SectionTitle';
import { StatusBadge } from '../../../../shared/presentation/components/StatusBadge';
import { colors, radius, spacing, typography } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import { formatTime } from '../../../../shared/utils/formatDateTime';
import type { OrderItem } from '../../domain/entities/ActiveOrder';
import { orderStatusLabel, orderStatusTone } from '../components/orderLabels';
import type { OrdersStackParamList } from '../navigation/OrdersNavigator';
import { useOrderDetail } from '../viewmodels/useOrderDetail';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderDetail'>;

function ItemRow({
  item,
  onRemove,
  removing,
}: {
  item: OrderItem;
  onRemove?: () => void;
  removing: boolean;
}) {
  return (
    <View style={styles.itemRow}>
      <Text style={styles.quantity}>{item.quantity}×</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemUnit}>{formatCurrency(item.unitPrice)} c/u</Text>
      </View>
      <Text style={styles.itemTotal}>{formatCurrency(item.unitPrice * item.quantity)}</Text>
      {onRemove && (
        <Button
          label="Quitar"
          variant="ghost"
          onPress={onRemove}
          loading={removing}
          accessibilityLabel={`Quitar ${item.name}`}
        />
      )}
    </View>
  );
}

export function OrderDetailScreen({ route }: Props) {
  const { orderId, tableNumber, place } = route.params;
  const vm = useOrderDetail(tableNumber, orderId);

  if (vm.isLoading) return <LoadingState message="Cargando pedido…" />;
  if (!vm.order) {
    return <ErrorState message={vm.errorMessage ?? 'No se pudo cargar el pedido.'} onRetry={vm.refresh} />;
  }

  const { order } = vm;
  const confirmCancel = () =>
    Alert.alert('Cancelar pedido', `¿Cancelar el pedido de ${place}? Cocina dejará de prepararlo.`, [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: vm.cancel },
    ]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={vm.isRefreshing}
          tintColor={colors.brand}
          onRefresh={async () => {
            await vm.refresh();
          }}
        />
      }
    >
      <Card elevation="raised">
        <Text style={styles.eyebrow}>Pedido</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title} accessibilityRole="header">
            {place}
          </Text>
          <StatusBadge label={orderStatusLabel(order.status)} tone={orderStatusTone(order.status)} />
        </View>
        {order.openedAt && <Text style={styles.meta}>Abierto a las {formatTime(order.openedAt)}</Text>}
      </Card>

      {vm.notice && <Notice tone="success" message={vm.notice} style={styles.notice} />}
      {vm.actionError && <Notice message={vm.actionError} style={styles.notice} />}

      <SectionTitle title="Platillos" style={styles.section} />
      <Card>
        {order.items.length === 0 ? (
          <Text style={styles.empty}>Este pedido ya no tiene platillos.</Text>
        ) : (
          order.items.map((item, index) => (
            <View key={item.id} style={index > 0 && styles.divider}>
              <ItemRow
                item={item}
                onRemove={vm.canRemoveItems ? () => vm.removeItem(item.id) : undefined}
                removing={vm.removingItemId === item.id}
              />
            </View>
          ))
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.total}>{formatCurrency(order.total)}</Text>
        </View>
      </Card>

      {vm.canConfirm && (
        <Button
          label="Confirmar y enviar a cocina"
          onPress={vm.confirm}
          loading={vm.isConfirming}
          style={styles.action}
        />
      )}
      {vm.canCancel && (
        <>
          <Button
            label="Cancelar pedido"
            variant="outline"
            onPress={confirmCancel}
            loading={vm.isCancelling}
            style={styles.action}
          />
          <Text style={styles.hint}>Solo se puede cancelar durante sus primeros 2 minutos en cocina.</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  eyebrow: { ...typography.overline, color: colors.brandStrong },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  title: { ...typography.title, color: colors.text, flexShrink: 1 },
  meta: { ...typography.small, color: colors.textSecondary, marginTop: spacing.xs },
  notice: { marginTop: spacing.lg },
  section: { marginTop: spacing.xl },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  quantity: {
    ...typography.bodyStrong,
    color: colors.brandStrong,
    backgroundColor: colors.brandSoft,
    borderRadius: radius.sm,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  itemInfo: { flex: 1 },
  itemName: { ...typography.bodyStrong, color: colors.text },
  itemUnit: { ...typography.caption, color: colors.textSecondary },
  itemTotal: { ...typography.bodyStrong, color: colors.text },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  empty: { ...typography.body, color: colors.textSecondary, paddingVertical: spacing.sm },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { ...typography.subheading, color: colors.textSecondary },
  total: { ...typography.title, color: colors.text },
  action: { marginTop: spacing.xl },
  hint: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});

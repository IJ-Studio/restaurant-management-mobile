import Ionicons from '@expo/vector-icons/Ionicons';
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
import { ACTION_LABEL, orderStatusLabel, orderStatusTone, STEP_FOR } from '../components/orderLabels';
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
        {item.notes ? <Text style={styles.itemNotes}>Nota: {item.notes}</Text> : null}
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

export function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId, place } = route.params;
  const vm = useOrderDetail(orderId);

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
  const stepButtons = (['start', 'ready', 'deliver'] as const).filter((action) => vm.can(action));

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
        <View style={styles.facts}>
          <View style={styles.fact}>
            <Ionicons name="people-outline" size={16} color={colors.brandStrong} />
            <Text style={styles.factText}>
              {order.guests} {order.guests === 1 ? 'comensal' : 'comensales'}
            </Text>
          </View>
          {order.waiter && (
            <View style={styles.fact}>
              <Ionicons name="person-outline" size={16} color={colors.brandStrong} />
              <Text style={styles.factText}>Atendió {order.waiter}</Text>
            </View>
          )}
        </View>
      </Card>

      {order.kitchenNotes && (
        <Notice tone="warning" message={`Nota para cocina: ${order.kitchenNotes}`} style={styles.notice} />
      )}
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
                onRemove={vm.can('remove-item') ? () => vm.removeItem(item.id) : undefined}
                removing={vm.removingItemId === item.id}
              />
            </View>
          ))
        )}
        {order.payments.map((payment) => (
          <View key={payment.id} style={styles.tipRow}>
            <Text style={styles.tipLabel}>
              Pagado · {payment.reference ?? payment.method}
              {payment.cashier ? ` · ${payment.cashier}` : ''}
            </Text>
            <Text style={styles.paidLabel}>−{formatCurrency(payment.amount)}</Text>
          </View>
        ))}
        {order.payments.length > 0 && order.remaining > 0 && (
          <View style={styles.tipRow}>
            <Text style={styles.remainingLabel}>Falta por cobrar</Text>
            <Text style={styles.remainingLabel}>{formatCurrency(order.remaining)}</Text>
          </View>
        )}
        {order.tip > 0 && (
          <View style={styles.tipRow}>
            <Text style={styles.tipLabel}>Propina</Text>
            <Text style={styles.tipLabel}>{formatCurrency(order.tip)}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.total}>{formatCurrency(order.total)}</Text>
        </View>
      </Card>

      {vm.can('confirm') && (
        <Button
          label={ACTION_LABEL.confirm}
          onPress={vm.confirm}
          loading={vm.busy === 'confirm'}
          style={styles.action}
        />
      )}
      {stepButtons.map((action) => {
        const step = STEP_FOR[action]!;
        return (
          <Button
            key={action}
            label={ACTION_LABEL[action]}
            onPress={() => vm.advance(step)}
            loading={vm.busy === step}
            variant={action === 'deliver' ? 'secondary' : 'primary'}
            style={styles.action}
          />
        );
      })}
      {vm.can('charge') && (
        <Button
          label={`${ACTION_LABEL.charge} ${formatCurrency(order.total)}`}
          accessibilityLabel={ACTION_LABEL.charge}
          variant="secondary"
          onPress={() => navigation.navigate('Charge', { orderId, place })}
          style={styles.action}
        />
      )}
      {vm.can('cancel') && (
        <>
          <Button
            label={ACTION_LABEL.cancel}
            variant="outline"
            onPress={confirmCancel}
            loading={vm.busy === 'cancel'}
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
  itemNotes: { ...typography.caption, color: colors.warning, marginTop: spacing.xxs },
  itemTotal: { ...typography.bodyStrong, color: colors.text },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  empty: { ...typography.body, color: colors.textSecondary, paddingVertical: spacing.sm },
  tipRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  tipLabel: { ...typography.small, color: colors.textSecondary, flexShrink: 1 },
  paidLabel: { ...typography.small, color: colors.success },
  remainingLabel: { ...typography.bodyStrong, color: colors.warning },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  fact: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  factText: { ...typography.caption, color: colors.textSecondary },
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
  action: { marginTop: spacing.lg },
  hint: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});

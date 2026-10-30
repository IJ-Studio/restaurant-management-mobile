import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '../../../../shared/presentation/components/StatusBadge';
import { colors, radius, shadows, spacing, typography } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import type { ActiveOrder } from '../../domain/entities/ActiveOrder';
import { orderStatusLabel, orderStatusTone } from './orderLabels';

interface Props {
  order: ActiveOrder;
  /** Sin `onPress` la tarjeta solo informa (cocina, pedidos a domicilio). */
  onPress?: () => void;
}

/** Tarjeta de un pedido activo: lugar, estatus, cliente, hora, primer platillo y total. */
export function OrderCard({ order, onPress }: Props) {
  const status = orderStatusLabel(order.status);
  const total = formatCurrency(order.total);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${order.place}, ${status}, ${order.customer}, ${total}`}
      accessibilityHint={onPress ? 'Abre el detalle del pedido' : undefined}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.place} numberOfLines={1}>
          {order.place}
        </Text>
        <StatusBadge label={status} tone={orderStatusTone(order.status)} />
      </View>
      <Text style={styles.meta} numberOfLines={1}>
        {order.customer} · {order.time}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.item} numberOfLines={1}>
          {order.firstItem}
        </Text>
        <Text style={styles.total}>{total}</Text>
        {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  pressed: { backgroundColor: colors.elevated },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  place: { ...typography.heading, color: colors.text, flexShrink: 1 },
  meta: { ...typography.small, color: colors.textSecondary, marginTop: spacing.xxs },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  item: { ...typography.body, color: colors.text, flex: 1 },
  total: { ...typography.price, color: colors.brandStrong },
});

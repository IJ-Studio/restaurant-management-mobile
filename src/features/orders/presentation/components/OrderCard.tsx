import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { StatusBadge } from '../../../../shared/presentation/components/StatusBadge';
import {
  colors,
  pressScale,
  radius,
  shadows,
  spacing,
  typography,
} from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import {
  KITCHEN_STATUSES,
  LATE_AFTER_MS,
  minutesOpen,
  type ActiveOrder,
} from '../../domain/entities/ActiveOrder';
import { orderStatusLabel, orderStatusTone } from './orderLabels';

interface Props {
  order: ActiveOrder;
  /** Sin `onPress` la tarjeta solo informa. */
  onPress?: () => void;
  /** Siguiente paso de un toque (cocina: empezar / marcar lista; piso: entregar). */
  action?: { label: string; onPress: () => void; loading?: boolean };
  /** Cocina necesita ver todos los platillos; el resto, solo el primero. */
  showAllItems?: boolean;
  now?: Date;
}

const LATE_MINUTES = LATE_AFTER_MS / 60000;
/** Cuántos platillos se listan en la tarjeta antes de resumir con "+N más". */
const MAX_ITEMS = 6;

function waitingLabel(minutes: number): string {
  if (minutes < 1) return 'recién';
  if (minutes < 60) return `hace ${minutes} min`;
  return `hace ${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/** Tarjeta de un pedido activo: lugar, estatus, espera, platillos, total y su siguiente paso. */
export function OrderCard({ order, onPress, action, showAllItems = false, now = new Date() }: Props) {
  const status = orderStatusLabel(order.status);
  const total = formatCurrency(order.total);
  const minutes = minutesOpen(order.openedAt, now);
  const late = minutes !== undefined && minutes >= LATE_MINUTES && KITCHEN_STATUSES.includes(order.status);
  const items = order.items.length > 0 ? order.items : [{ name: order.firstItem, quantity: 1 }];
  const shown = showAllItems ? items.slice(0, MAX_ITEMS) : items.slice(0, 1);
  const hidden = items.length - shown.length;

  return (
    <View style={[styles.card, late && styles.lateCard]}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${order.place}, ${status}, ${order.customer}, ${total}`}
        accessibilityHint={onPress ? 'Abre el detalle del pedido' : undefined}
        style={({ pressed }) => [styles.body, pressed && styles.pressed, pressed && pressScale]}
      >
        <View style={styles.header}>
          <Text style={styles.place} numberOfLines={1}>
            {order.place}
          </Text>
          <StatusBadge label={status} tone={orderStatusTone(order.status)} />
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {order.customer} · {order.time}
          </Text>
          {minutes !== undefined && (
            <View style={styles.wait}>
              <Ionicons name="time-outline" size={14} color={late ? colors.danger : colors.textSecondary} />
              <Text style={[styles.waitText, late && styles.lateText]}>{waitingLabel(minutes)}</Text>
            </View>
          )}
        </View>
        <View style={styles.items}>
          {shown.map((item, index) => (
            <Text key={`${item.name}-${index}`} style={styles.item} numberOfLines={1}>
              {showAllItems ? <Text style={styles.quantity}>{item.quantity}× </Text> : null}
              {item.name}
            </Text>
          ))}
          {hidden > 0 && <Text style={styles.more}>+{hidden} más</Text>}
        </View>
        <View style={styles.footer}>
          <Text style={styles.total}>{total}</Text>
          {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
        </View>
      </Pressable>
      {action && (
        <Button
          label={action.label}
          onPress={action.onPress}
          loading={action.loading}
          accessibilityLabel={`${action.label}: ${order.place}`}
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  lateCard: { borderColor: colors.danger, borderWidth: 1.5 },
  body: { padding: spacing.lg },
  pressed: { backgroundColor: colors.elevated },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  place: { ...typography.heading, color: colors.text, flexShrink: 1 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxs,
  },
  meta: { ...typography.small, color: colors.textSecondary, flexShrink: 1 },
  wait: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, marginLeft: spacing.sm },
  waitText: { ...typography.caption, color: colors.textSecondary },
  lateText: { color: colors.danger },
  items: { marginTop: spacing.md, gap: spacing.xxs },
  item: { ...typography.body, color: colors.text },
  quantity: { ...typography.bodyStrong, color: colors.brandStrong },
  more: { ...typography.caption, color: colors.textSecondary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  total: { ...typography.price, color: colors.brandStrong },
  action: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
});

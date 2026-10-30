import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../../../../shared/presentation/theme';
import {
  formatDateTime,
  formatDay,
  formatMonthShort,
  formatTime,
} from '../../../../shared/utils/formatDateTime';
import type { Reservation } from '../../domain/entities/Reservation';
import { reservationSummary } from './reservationLabels';

const DATE_BLOCK = 56;

/** Tarjeta de una reservación: bloque de fecha, cliente, resumen (personas · mesa · estado) y hora. */
export function ReservationCard({ reservation }: { reservation: Reservation }) {
  const summary = reservationSummary(reservation);
  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${reservation.customerName}, ${summary}, ${formatDateTime(reservation.dateTime)}`}
    >
      <View style={styles.date}>
        <Text style={styles.day}>{formatDay(reservation.dateTime)}</Text>
        <Text style={styles.month}>{formatMonthShort(reservation.dateTime)}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {reservation.customerName}
        </Text>
        <Text style={styles.summary}>{summary}</Text>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={14} color={colors.brandStrong} />
          <Text style={styles.time}>{formatTime(reservation.dateTime)}</Text>
          {reservation.occasion ? <Text style={styles.occasion}>· {reservation.occasion}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  date: {
    width: DATE_BLOCK,
    height: DATE_BLOCK,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: { ...typography.title, color: colors.brandStrong },
  month: { ...typography.overline, color: colors.brandStrong, letterSpacing: 1 },
  body: { flex: 1 },
  name: { ...typography.subheading, color: colors.text },
  summary: { ...typography.small, color: colors.textSecondary, marginTop: spacing.xxs },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  time: { ...typography.caption, color: colors.brandStrong },
  occasion: { ...typography.caption, color: colors.textSecondary, flexShrink: 1 },
});

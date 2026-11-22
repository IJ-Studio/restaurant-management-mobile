import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../../../shared/presentation/theme';
import {
  formatDateTime,
  formatDay,
  formatMonthShort,
  formatTime,
} from '../../../../shared/utils/formatDateTime';
import type { Reservation } from '../../domain/entities/Reservation';
import { reservationSummary } from './reservationLabels';

const DATE_BLOCK = 56;

/**
 * Tarjeta de una reservación: sello de fecha, cliente, resumen (personas · mesa · estado) y hora.
 * `footer` va dentro del borde de la tarjeta, fuera del grupo accesible para que sus botones se enfoquen solos.
 */
export function ReservationCard({ reservation, footer }: { reservation: Reservation; footer?: ReactNode }) {
  const summary = reservationSummary(reservation);
  return (
    <View style={styles.card}>
      <View
        style={styles.content}
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
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  // Sello de fecha: caja de control café con el día en Fraunces y el mes en versalitas.
  date: {
    width: DATE_BLOCK,
    height: DATE_BLOCK,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: { ...typography.title, color: colors.brand },
  month: { ...typography.overline, color: colors.textSecondary },
  body: { flex: 1 },
  name: { ...typography.subheading, color: colors.text },
  summary: { ...typography.small, color: colors.textSecondary, marginTop: spacing.xxs },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  time: { ...typography.caption, color: colors.brandStrong },
  occasion: { ...typography.caption, color: colors.textSecondary, flexShrink: 1 },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});

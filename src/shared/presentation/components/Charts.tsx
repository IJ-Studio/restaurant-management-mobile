import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

const BAR_AREA = 120;
/** Horas mínimas que se muestran aunque solo haya ventas en una. */
const MIN_HOURS = 6;

function hourLabel(hour: number): string {
  const suffix = hour < 12 ? 'a' : 'p';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${suffix}`;
}

/** Rango de horas con actividad (de la primera a la última con ventas), al menos MIN_HOURS. */
export function activeHours(values: number[]): number[] {
  const withSales = values.map((v, h) => (v > 0 ? h : -1)).filter((h) => h >= 0);
  if (withSales.length === 0) return [];
  let start = withSales[0];
  let end = withSales[withSales.length - 1];
  while (end - start + 1 < MIN_HOURS) {
    if (start > 0) start -= 1;
    if (end - start + 1 < MIN_HOURS && end < 23) end += 1;
    if (start === 0 && end === 23) break;
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

interface HourlyProps {
  values: number[];
  format: (value: number) => string;
  emptyMessage?: string;
}

/** Barras verticales por hora del día; la hora pico va en naranja de marca. */
export function HourlyBars({ values, format, emptyMessage = 'Sin cobros todavía.' }: HourlyProps) {
  const hours = activeHours(values);
  if (hours.length === 0) return <Text style={styles.empty}>{emptyMessage}</Text>;
  const max = Math.max(...hours.map((h) => values[h]));
  const peak = hours.find((h) => values[h] === max) ?? hours[0];

  return (
    <View
      accessible
      accessibilityLabel={`Ventas por hora. Hora con más ventas: ${hourLabel(peak)}m, ${format(max)}.`}
    >
      <Text style={styles.peak}>
        Hora pico {hourLabel(peak)}m · {format(max)}
      </Text>
      <View style={styles.bars}>
        {hours.map((hour) => {
          const value = values[hour];
          const height = max > 0 ? Math.max(value > 0 ? 4 : 2, (value / max) * BAR_AREA) : 2;
          return (
            <View key={hour} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height },
                    hour === peak ? styles.barPeak : value > 0 ? styles.barOn : styles.barOff,
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{hourLabel(hour)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export interface BreakdownItem {
  label: string;
  value: number;
  /** Texto chico bajo la etiqueta ("4 cobros", "9 comensales"). */
  detail?: string;
}

interface BreakdownProps {
  items: BreakdownItem[];
  format: (value: number) => string;
  /** Muestra el porcentaje del total junto al valor. */
  showPercent?: boolean;
  emptyMessage?: string;
  /** Inicial en un círculo (ranking de personas). */
  avatars?: boolean;
}

/** Barras horizontales: métodos de pago, ventas por persona, platillos más vendidos. */
export function BreakdownBars({
  items,
  format,
  showPercent = false,
  emptyMessage = 'Sin datos todavía.',
  avatars = false,
}: BreakdownProps) {
  if (items.length === 0) return <Text style={styles.empty}>{emptyMessage}</Text>;
  const max = Math.max(...items.map((item) => item.value), 0);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.rows}>
      {items.map((item, index) => {
        const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
        const width = max > 0 ? `${Math.max(3, (item.value / max) * 100)}%` : '3%';
        return (
          <View
            key={`${item.label}-${index}`}
            style={styles.row}
            accessible
            accessibilityLabel={[
              item.label,
              format(item.value),
              showPercent ? `${percent}%` : null,
              item.detail,
            ]
              .filter(Boolean)
              .join(', ')}
          >
            {avatars && (
              <View style={[styles.avatar, index === 0 && styles.avatarFirst]}>
                <Text style={[styles.avatarText, index === 0 && styles.avatarTextFirst]}>
                  {item.label.trim().charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.rowBody}>
              <View style={styles.rowHeader}>
                <Text style={styles.rowLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={styles.rowValue}>
                  {format(item.value)}
                  {showPercent ? ` · ${percent}%` : ''}
                </Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[styles.fill, { width: width as `${number}%` }, index === 0 && styles.fillFirst]}
                />
              </View>
              {item.detail && <Text style={styles.rowDetail}>{item.detail}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const AVATAR = 36;
const TRACK = 8;

const styles = StyleSheet.create({
  empty: { ...typography.body, color: colors.textSecondary },
  peak: { ...typography.caption, color: colors.brandStrong, marginBottom: spacing.sm },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  barColumn: { flex: 1, alignItems: 'center' },
  barTrack: { height: BAR_AREA, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: '70%', borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm },
  barOn: { backgroundColor: colors.borderStrong },
  barOff: { backgroundColor: colors.subtle },
  barPeak: { backgroundColor: colors.brand },
  barLabel: { ...typography.badge, color: colors.textSecondary, marginTop: spacing.xs },
  rows: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.pill,
    backgroundColor: colors.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFirst: { backgroundColor: colors.brandSoft },
  avatarText: { ...typography.bodyStrong, color: colors.textSecondary },
  avatarTextFirst: { color: colors.brandStrong },
  rowBody: { flex: 1 },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  rowLabel: { ...typography.bodyStrong, color: colors.text, flexShrink: 1 },
  rowValue: { ...typography.bodyStrong, color: colors.text },
  track: { height: TRACK, borderRadius: radius.pill, backgroundColor: colors.subtle, overflow: 'hidden' },
  fill: { height: TRACK, borderRadius: radius.pill, backgroundColor: colors.borderStrong },
  fillFirst: { backgroundColor: colors.brand },
  rowDetail: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
});

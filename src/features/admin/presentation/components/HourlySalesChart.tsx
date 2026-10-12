import { StyleSheet, Text, View } from 'react-native';

import { formatPrice } from '../../../../shared/presentation/format';
import { peakHour } from '../../domain/entities/Dashboard';

const CHART_HEIGHT = 140;

/** Barras de ventas por hora hechas con Views (sin librería de gráficas). */
export function HourlySalesChart({ salesByHour }: { salesByHour: number[] }) {
  const max = Math.max(...salesByHour, 0);
  const peak = peakHour(salesByHour);
  const summary =
    peak === null
      ? 'Sin ventas registradas hoy.'
      : `Hora con más ventas: ${peak}:00, ${formatPrice(salesByHour[peak])}.`;

  return (
    <View accessible accessibilityLabel={`Ventas por hora. ${summary}`}>
      <View style={styles.chart}>
        {salesByHour.map((total, hour) => (
          <View key={hour} style={styles.column} testID={`bar-${hour}`}>
            <View
              style={[
                styles.bar,
                hour === peak && styles.peak,
                { height: max > 0 ? Math.max((total / max) * CHART_HEIGHT, total > 0 ? 2 : 0) : 0 },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.axis}>
        {[0, 6, 12, 18, 23].map((hour) => (
          <Text key={hour} style={styles.axisLabel}>
            {hour}h
          </Text>
        ))}
      </View>
      <Text style={styles.summary}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { height: CHART_HEIGHT, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  column: { flex: 1, justifyContent: 'flex-end' },
  bar: { backgroundColor: '#9ec5fe', borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  peak: { backgroundColor: '#1f6feb' },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  axisLabel: { fontSize: 11, color: '#777' },
  summary: { marginTop: 8, fontSize: 13, color: '#555' },
});

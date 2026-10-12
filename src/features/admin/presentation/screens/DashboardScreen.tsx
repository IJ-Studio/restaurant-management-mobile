import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../../shared/presentation/components/Card';
import { QueryState } from '../../../../shared/presentation/components/QueryState';
import { formatPrice } from '../../../../shared/presentation/format';
import { occupancy } from '../../domain/entities/Dashboard';
import { HourlySalesChart } from '../components/HourlySalesChart';
import { useDashboard } from '../viewmodels/useDashboard';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

/** Indicadores del día para el Administrador (HU-08). */
export function DashboardScreen() {
  const { dashboard, isLoading, isRefreshing, error, updatedAt, refresh } = useDashboard();

  if (!dashboard) {
    return <QueryState isLoading={isLoading} error={error} onRetry={refresh} loadingLabel="Cargando dashboard" />;
  }

  const { stats, salesByHour } = dashboard;
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
    >
      {error ? (
        <Text style={styles.warning} accessibilityRole="alert">
          No se pudo actualizar: {error}
        </Text>
      ) : null}
      <Card style={styles.sales}>
        <Text style={styles.statLabel}>Ventas de hoy</Text>
        <Text style={styles.salesValue}>{formatPrice(stats.totalSales)}</Text>
      </Card>
      <View style={styles.grid}>
        <Stat label="Pedidos pendientes" value={String(stats.pendingOrders)} />
        <Stat label="En preparación" value={String(stats.ordersInPreparation)} />
        <Stat label="Mesas ocupadas" value={`${stats.occupiedTables} de ${stats.totalTables}`} />
        <Stat label="Ocupación" value={`${occupancy(stats)}%`} />
      </View>
      <Card style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Ventas por hora</Text>
        <HourlySalesChart salesByHour={salesByHour} />
      </Card>
      {updatedAt ? (
        <Text style={styles.updated}>
          Actualizado a las{' '}
          {updatedAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  warning: { color: '#b00020', fontSize: 13 },
  sales: { gap: 4 },
  salesValue: { fontSize: 32, fontWeight: '700', color: '#111' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { flexBasis: '47%', flexGrow: 1, gap: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 13, color: '#555' },
  chartCard: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  updated: { fontSize: 12, color: '#777', textAlign: 'center' },
});

import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { ScreenHeader } from '../../../../shared/presentation/components/ScreenHeader';
import { SectionTitle } from '../../../../shared/presentation/components/SectionTitle';
import { StatCard } from '../../../../shared/presentation/components/StatCard';
import { StatusBadge, type StatusTone } from '../../../../shared/presentation/components/StatusBadge';
import { colors, radius, shadows, spacing, typography } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import { formatDate } from '../../../../shared/utils/formatDateTime';
import { OrderCard } from '../../../orders/presentation/components/OrderCard';
import type { DashboardSummary, TableState, TableStatus } from '../../domain/entities/DashboardSummary';
import { useDashboard } from '../viewmodels/useDashboard';

const TABLE_STATE: Record<TableState, { label: string; tone: StatusTone }> = {
  ocupada: { label: 'Ocupada', tone: 'brand' },
  reservada: { label: 'Reservada', tone: 'info' },
  libre: { label: 'Libre', tone: 'success' },
};

function TableTile({ table }: { table: TableStatus }) {
  const state = TABLE_STATE[table.state];
  return (
    <View
      style={styles.table}
      accessible
      accessibilityLabel={`Mesa ${table.number}, ${state.label}, ${table.capacity} lugares`}
    >
      <Text style={styles.tableNumber}>{table.number}</Text>
      <Text style={styles.tableMeta} numberOfLines={1}>
        {table.area ?? `${table.capacity} lugares`}
      </Text>
      <StatusBadge label={state.label} tone={state.tone} style={styles.tableBadge} />
    </View>
  );
}

function Summary({ summary }: { summary: DashboardSummary }) {
  const { stats, tables, occupiedTables, recentOrders } = summary;
  return (
    <>
      <View style={styles.stats}>
        <StatCard
          label="Ventas del día"
          value={formatCurrency(stats.salesTotal)}
          icon="cash-outline"
          tone="brand"
          style={styles.stat}
        />
        <StatCard
          label="En cocina"
          value={String(stats.ordersInKitchen)}
          icon="flame-outline"
          style={styles.stat}
        />
        <StatCard
          label="Por confirmar"
          value={String(stats.pendingOrders)}
          icon="time-outline"
          style={styles.stat}
        />
        <StatCard
          label="Mesas ocupadas"
          value={String(occupiedTables)}
          hint={`de ${tables.length} mesas`}
          icon="restaurant-outline"
          style={styles.stat}
        />
      </View>

      <SectionTitle title="Mesas" style={styles.section} />
      {tables.length === 0 ? (
        <Text style={styles.empty}>No hay mesas activas.</Text>
      ) : (
        <View style={styles.tables}>
          {tables.map((table) => (
            <TableTile key={table.id} table={table} />
          ))}
        </View>
      )}

      <SectionTitle
        title="Pedidos de hoy"
        style={styles.section}
        right={<StatusBadge label={`${recentOrders.length} activos`} tone="neutral" />}
      />
      {recentOrders.length === 0 ? (
        <Text style={styles.empty}>Sin pedidos activos por ahora.</Text>
      ) : (
        <View style={styles.orders}>
          {recentOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </View>
      )}
    </>
  );
}

export function DashboardScreen() {
  const { summary, isLoading, isRefreshing, errorMessage, refresh } = useDashboard();

  let body;
  if (isLoading) body = <LoadingState message="Cargando el resumen…" />;
  else if (!summary)
    body = <ErrorState message={errorMessage ?? 'No se pudo cargar el resumen del día.'} onRetry={refresh} />;
  else body = <Summary summary={summary} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          tintColor={colors.brand}
          onRefresh={async () => {
            await refresh();
          }}
        />
      }
    >
      <ScreenHeader
        eyebrow={formatDate(new Date())}
        title="Resumen del día"
        subtitle="Ventas, pedidos y mesas de hoy."
        style={styles.header}
      />
      {summary && errorMessage && (
        <Notice message={`No se pudo actualizar: ${errorMessage}`} style={styles.notice} />
      )}
      {body}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
  header: { marginBottom: spacing.xl },
  notice: { marginBottom: spacing.lg },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: { flexGrow: 1, flexBasis: '45%' },
  section: { marginTop: spacing.xxl },
  tables: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  table: {
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  tableNumber: { ...typography.heading, color: colors.text },
  tableMeta: { ...typography.caption, color: colors.textSecondary },
  tableBadge: { marginTop: spacing.sm },
  orders: { gap: spacing.md },
  empty: { ...typography.body, color: colors.textSecondary },
});

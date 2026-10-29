import Ionicons from '@expo/vector-icons/Ionicons';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../../shared/presentation/components/Card';
import { BreakdownBars, HourlyBars } from '../../../../shared/presentation/components/Charts';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { FloorMap, type FloorTable } from '../../../../shared/presentation/components/FloorMap';
import { HeroCard } from '../../../../shared/presentation/components/HeroCard';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { SectionTitle } from '../../../../shared/presentation/components/SectionTitle';
import { StatCard } from '../../../../shared/presentation/components/StatCard';
import { StatusBadge } from '../../../../shared/presentation/components/StatusBadge';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import { formatDate, formatTime } from '../../../../shared/utils/formatDateTime';
import { useSession } from '../../../auth/presentation/viewmodels/useSession';
import { incidentSummary } from '../../../kitchen/presentation/viewmodels';
import { OrderCard } from '../../../orders/presentation/components/OrderCard';
import type { DailyReport, DashboardSummary } from '../../domain/entities/DashboardSummary';
import { useDashboard } from '../viewmodels/useDashboard';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "Buenos días" hasta mediodía, "Buenas tardes" hasta las 7 p.m., luego "Buenas noches". */
export function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Mesas del Dashboard en el formato del plano; "por cobrar" gana a "ocupada". */
export function floorTables(summary: DashboardSummary): FloorTable[] {
  return summary.tables.map((table) => ({
    id: table.id,
    number: table.number,
    capacity: table.capacity,
    shape: table.shape,
    area: table.area,
    state: table.awaitingPayment ? 'por_cobrar' : table.state,
  }));
}

function Kpis({ summary }: { summary: DashboardSummary }) {
  const { stats, tables, occupiedTables, report } = summary;
  return (
    <View style={styles.stats}>
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
        label="Listos para servir"
        value={String(stats.readyOrders)}
        icon="checkmark-done-outline"
        style={styles.stat}
      />
      <StatCard
        label="Por cobrar"
        value={String(stats.ordersToCharge)}
        icon="wallet-outline"
        style={styles.stat}
      />
      <StatCard
        label="Mesas ocupadas"
        value={String(occupiedTables)}
        hint={`de ${tables.length} mesas`}
        icon="restaurant-outline"
        style={styles.stat}
      />
      {report && (
        <StatCard
          label="Propinas"
          value={formatCurrency(report.sales.tips)}
          hint={plural(report.sales.payments, 'cobro', 'cobros')}
          icon="heart-outline"
          style={styles.stat}
        />
      )}
    </View>
  );
}

function LatestPayments({ payments }: { payments: DailyReport['latestPayments'] }) {
  if (payments.length === 0) return <Text style={styles.empty}>Todavía no hay cobros hoy.</Text>;
  return (
    <Card style={styles.list}>
      {payments.map((payment, index) => {
        const place = payment.table ? `Mesa ${payment.table}` : 'Sin mesa';
        const who = payment.cashier ?? 'pago en línea';
        return (
          <View
            key={`${payment.orderId}-${index}`}
            style={[styles.row, index > 0 && styles.divider]}
            accessible
            accessibilityLabel={`${place}, ${formatCurrency(payment.amount)}, ${payment.method ?? 'Otro'}, cobró ${who}`}
          >
            <Ionicons name="receipt-outline" size={20} color={colors.brandStrong} />
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>
                {place} · {payment.method ?? 'Otro'}
              </Text>
              <Text style={styles.rowMeta}>
                Cobró {who}
                {payment.at ? ` · ${formatTime(payment.at)}` : ''}
                {payment.tip > 0 ? ` · propina ${formatCurrency(payment.tip)}` : ''}
              </Text>
            </View>
            <Text style={styles.rowAmount}>{formatCurrency(payment.amount)}</Text>
          </View>
        );
      })}
    </Card>
  );
}

function KitchenSection({ report }: { report: DailyReport }) {
  return (
    <>
      <View style={styles.stats}>
        <StatCard
          label="Incidencias"
          value={String(report.incidents.length)}
          icon="alert-circle-outline"
          style={styles.stat}
        />
        <StatCard
          label="Mermas"
          value={formatCurrency(report.waste.cost)}
          hint={plural(report.waste.records, 'registro', 'registros')}
          icon="trash-outline"
          style={styles.stat}
        />
      </View>
      {report.incidents.length > 0 && (
        <Card style={[styles.list, styles.gapTop]}>
          {report.incidents.slice(0, 5).map((incident, index) => (
            <View
              key={incident.id}
              style={[styles.row, index > 0 && styles.divider]}
              accessible
              accessibilityLabel={`Incidencia${incident.table ? ` en mesa ${incident.table}` : ''}: ${incidentSummary(incident)}`}
            >
              <Ionicons name="warning-outline" size={20} color={colors.warning} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>{incident.table ? `Mesa ${incident.table}` : 'General'}</Text>
                <Text style={styles.rowMeta}>{incidentSummary(incident)}</Text>
              </View>
              {incident.at && <Text style={styles.rowMeta}>{formatTime(incident.at)}</Text>}
            </View>
          ))}
        </Card>
      )}
    </>
  );
}

/** Quién vendió, cómo pagaron y qué se vendió (GET /reportes/hoy). */
function Report({ report }: { report: DailyReport }) {
  return (
    <>
      <SectionTitle title="Ventas por hora" style={styles.section} />
      <Card>
        <HourlyBars
          values={report.byHour}
          format={formatCurrency}
          emptyMessage="Todavía no hay cobros hoy."
        />
      </Card>

      <SectionTitle title="Cómo pagaron" style={styles.section} />
      <Card>
        <BreakdownBars
          items={report.byMethod.map((m) => ({
            label: m.method,
            value: m.total,
            detail: plural(m.payments, 'cobro', 'cobros'),
          }))}
          format={formatCurrency}
          showPercent
          emptyMessage="Todavía no hay cobros hoy."
        />
      </Card>

      <SectionTitle title="Ventas por mesero" style={styles.section} />
      <Card>
        <BreakdownBars
          avatars
          items={report.byWaiter.map((w) => ({
            label: w.name,
            value: w.total,
            detail: `${plural(w.orders, 'pedido', 'pedidos')} · ${plural(w.guests, 'comensal', 'comensales')}`,
          }))}
          format={formatCurrency}
          emptyMessage="Todavía no hay pedidos hoy."
        />
      </Card>

      <SectionTitle title="Cobros por cajero" style={styles.section} />
      <Card>
        <BreakdownBars
          avatars
          items={report.byCashier.map((c) => ({
            label: c.name,
            value: c.total,
            detail: plural(c.payments, 'cobro', 'cobros'),
          }))}
          format={formatCurrency}
          emptyMessage="Todavía no hay cobros hoy."
        />
        {report.openRegisters.length > 0 && (
          <View style={styles.registers}>
            {report.openRegisters.map((register) => (
              <StatusBadge
                key={register.id}
                tone="success"
                label={`Caja abierta · ${register.cashier ?? 'Cajero'}${register.since ? ` desde ${formatTime(register.since)}` : ''}`}
              />
            ))}
          </View>
        )}
      </Card>

      <SectionTitle title="Lo más vendido" style={styles.section} />
      <Card>
        <BreakdownBars
          items={report.topDishes.map((d) => ({
            label: d.name,
            value: d.quantity,
            detail: formatCurrency(d.total),
          }))}
          format={(value) => plural(value, 'vendido', 'vendidos')}
          emptyMessage="Todavía no se vende nada hoy."
        />
      </Card>

      <SectionTitle title="Últimos cobros" style={styles.section} />
      <LatestPayments payments={report.latestPayments} />

      <SectionTitle title="Cocina" style={styles.section} />
      <KitchenSection report={report} />
    </>
  );
}

function Summary({ summary }: { summary: DashboardSummary }) {
  const { tables, recentOrders, report } = summary;
  return (
    <>
      <Kpis summary={summary} />

      <SectionTitle title="Mesas" style={styles.section} />
      {tables.length === 0 ? (
        <Text style={styles.empty}>No hay mesas activas.</Text>
      ) : (
        <Card>
          <FloorMap tables={floorTables(summary)} showLegend />
        </Card>
      )}

      {report && <Report report={report} />}

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

function SalesHeader({ summary }: { summary?: DashboardSummary }) {
  const report = summary?.report;
  // Con el resumen detallado se muestra lo cobrado; sin él, el total de pedidos del día.
  const value = summary ? (report?.sales.collected ?? summary.stats.salesTotal) : undefined;
  const sales = value !== undefined ? formatCurrency(value) : '—';
  return (
    <View style={styles.sales} accessible accessibilityLabel={`Ventas del día, ${sales}`}>
      <Text style={styles.salesLabel}>{report ? 'Cobrado hoy' : 'Ventas del día'}</Text>
      <Text style={styles.salesValue} numberOfLines={1} adjustsFontSizeToFit>
        {sales}
      </Text>
      {report && (
        <Text style={styles.salesHint}>
          {plural(report.sales.paidOrders, 'cuenta', 'cuentas')} · ticket promedio{' '}
          {formatCurrency(report.sales.averageTicket)} ·{' '}
          {plural(report.sales.guests, 'comensal', 'comensales')}
        </Text>
      )}
    </View>
  );
}

export function DashboardScreen() {
  const { summary, isLoading, isRefreshing, errorMessage, refresh } = useDashboard();
  const name = useSession((state) => state.session?.user.name);
  const now = new Date();

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
      <HeroCard
        eyebrow={formatDate(now)}
        title="Resumen del día"
        subtitle={name ? `${greeting(now)}, ${name}.` : `${greeting(now)}.`}
        style={styles.header}
      >
        <SalesHeader summary={summary} />
      </HeroCard>
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
  sales: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.onBrandSurface,
  },
  salesLabel: { ...typography.overline, color: colors.textOnBrandMuted },
  salesValue: { ...typography.amount, color: colors.textOnBrand, marginTop: spacing.xs },
  salesHint: { ...typography.small, color: colors.textOnBrandMuted, marginTop: spacing.xs },
  notice: { marginBottom: spacing.lg },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: { flexGrow: 1, flexBasis: '45%' },
  section: { marginTop: spacing.xxl },
  gapTop: { marginTop: spacing.md },
  registers: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  list: { paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowInfo: { flex: 1 },
  rowTitle: { ...typography.bodyStrong, color: colors.text },
  rowMeta: { ...typography.caption, color: colors.textSecondary },
  rowAmount: { ...typography.price, color: colors.brandStrong },
  orders: { gap: spacing.md },
  empty: { ...typography.body, color: colors.textSecondary },
});

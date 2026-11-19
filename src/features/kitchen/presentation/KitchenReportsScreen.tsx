import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../shared/presentation/components/Button';
import { Card } from '../../../shared/presentation/components/Card';
import { SectionTitle } from '../../../shared/presentation/components/SectionTitle';
import { StatusBadge } from '../../../shared/presentation/components/StatusBadge';
import { colors, spacing, typography } from '../../../shared/presentation/theme';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { formatTime } from '../../../shared/utils/formatDateTime';
import { useSession } from '../../auth/presentation/viewmodels/useSession';
import { wasteReasonLabel } from '../domain/Kitchen';
import { incidentSummary, useIncidents, useLowStock, useWasteToday } from './viewmodels';

type Nav = NativeStackNavigationProp<{ ReportIncident: undefined; ReportWaste: undefined }>;

/** Reportes del día de cocina: incidencias y mermas, con accesos para registrar nuevas. */
export function KitchenReportsScreen() {
  const navigation = useNavigation<Nav>();
  const incidents = useIncidents();
  const waste = useWasteToday();
  const stock = useLowStock();
  // Las mermas las registra el personal operativo; el admin solo ve el registro (el API también lo impide).
  const canReportWaste = useSession((state) => state.session?.user.role) !== 'admin';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={false}
          tintColor={colors.brand}
          onRefresh={() => {
            void incidents.refresh();
            void waste.refresh();
            void stock.refresh();
          }}
        />
      }
    >
      <View style={styles.actions}>
        <Button
          label="Reportar incidencia"
          variant="secondary"
          onPress={() => navigation.navigate('ReportIncident')}
          style={styles.action}
        />
        {canReportWaste && (
          <Button
            label="Registrar merma"
            onPress={() => navigation.navigate('ReportWaste')}
            style={styles.action}
          />
        )}
      </View>

      <SectionTitle title="Existencias bajas" style={styles.section} />
      {stock.errorMessage ? (
        <Text style={styles.empty}>{stock.errorMessage}</Text>
      ) : !stock.isLoading && stock.products.length === 0 ? (
        <Text style={styles.empty}>Nada por debajo de su mínimo.</Text>
      ) : (
        stock.products.map((product) => (
          <Card key={product.id} style={styles.stockRow}>
            <View style={styles.stockText}>
              <Text style={styles.stockName}>{product.name}</Text>
              <Text style={styles.stockHint}>
                Quedan {product.stock} {product.unit} · mínimo {product.minStock}
              </Text>
            </View>
            <StatusBadge label="Bajo" tone="danger" />
          </Card>
        ))
      )}

      <SectionTitle
        title="Incidencias de hoy"
        style={styles.section}
        right={<StatusBadge label={String(incidents.incidents.length)} tone="warning" />}
      />
      {incidents.errorMessage && <Text style={styles.error}>{incidents.errorMessage}</Text>}
      {incidents.incidents.length === 0 ? (
        <Text style={styles.empty}>Sin incidencias hoy.</Text>
      ) : (
        <Card style={styles.list}>
          {incidents.incidents.map((incident, index) => (
            <View key={incident.id} style={[styles.row, index > 0 && styles.divider]}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>{incidentSummary(incident)}</Text>
                <Text style={styles.rowMeta}>
                  {incident.table ? `Mesa ${incident.table}` : 'General'}
                  {incident.at ? ` · ${formatTime(incident.at)}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      <SectionTitle
        title="Mermas de hoy"
        style={styles.section}
        right={<StatusBadge label={formatCurrency(waste.totalCost)} tone="danger" />}
      />
      {waste.errorMessage && <Text style={styles.error}>{waste.errorMessage}</Text>}
      {waste.records.length === 0 ? (
        <Text style={styles.empty}>Sin mermas registradas hoy.</Text>
      ) : (
        <Card style={styles.list}>
          {waste.records.map((record, index) => (
            <View key={record.id} style={[styles.row, index > 0 && styles.divider]}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>
                  {record.quantity} {record.unit} de {record.productName}
                </Text>
                <Text style={styles.rowMeta}>
                  {wasteReasonLabel(record.reason)} · {record.justification}
                  {record.reportedBy ? ` · ${record.reportedBy}` : ''}
                </Text>
              </View>
              <Text style={styles.cost}>{formatCurrency(record.cost)}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  action: { flexGrow: 1, flexBasis: '45%' },
  section: { marginTop: spacing.xl },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  stockText: { flex: 1 },
  stockName: { ...typography.bodyStrong, color: colors.text },
  stockHint: { ...typography.caption, color: colors.textSecondary },
  list: { paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowInfo: { flex: 1 },
  rowTitle: { ...typography.bodyStrong, color: colors.text },
  rowMeta: { ...typography.caption, color: colors.textSecondary },
  cost: { ...typography.bodyStrong, color: colors.danger },
  empty: { ...typography.body, color: colors.textSecondary },
  error: { ...typography.small, color: colors.danger, marginBottom: spacing.sm },
});

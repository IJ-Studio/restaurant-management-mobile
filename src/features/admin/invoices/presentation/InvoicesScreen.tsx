import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { StatusBadge } from '../../../../shared/presentation/components/StatusBadge';
import { TextField } from '../../../../shared/presentation/components/TextField';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import { formatDateTime } from '../../../../shared/utils/formatDateTime';
import { properName } from '../../../../shared/utils/formatCase';
import { useInvoices } from './useInvoices';

/** Facturas del admin (Fase 2): solicitudes pendientes; emitir (pedido pagado) o rechazar con motivo. */
export function InvoicesScreen() {
  const vm = useInvoices();
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  if (vm.isLoading) return <LoadingState message="Cargando las solicitudes…" />;
  if (vm.error) return <ErrorState message={vm.error} onRetry={vm.refresh} />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={false} onRefresh={vm.refresh} />}
    >
      <Text style={styles.hint}>
        Solicitudes pendientes. Se emiten a nombre del cliente con sus datos fiscales.
      </Text>
      {vm.message && <Notice tone={vm.message.tone} message={vm.message.text} />}
      {vm.requests.length === 0 && (
        <Text style={styles.hint}>
          Sin solicitudes pendientes. Cuando un cliente pida su factura aparecerá aquí para emitirla.
        </Text>
      )}
      {vm.requests.map((r) => {
        const name = properName(r.customer);
        return (
          <Card key={r.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{name}</Text>
              <StatusBadge
                label={r.paid ? 'Pagado' : 'Sin confirmar'}
                tone={r.paid ? 'success' : 'warning'}
              />
            </View>
            <Text style={styles.hint}>
              {`${r.rfc ?? 'Sin RFC'} · ${r.businessName ?? '—'}${r.email ? ` · ${r.email}` : ''}`}
            </Text>
            <Text style={styles.hint}>
              {`Pedida ${formatDateTime(r.requestedAt)} · ${r.total === null ? '—' : formatCurrency(r.total)}`}
            </Text>
            <View style={styles.actions}>
              <Button
                label="Emitir"
                loading={vm.busy && rejecting === null}
                disabled={!r.paid || vm.busy}
                onPress={() => void vm.issue(r)}
                accessibilityLabel={`Emitir la factura de ${name}`}
              />
              <Button
                label="Rechazar"
                variant="ghost"
                onPress={() => {
                  setReason('');
                  setRejecting(rejecting === r.id ? null : r.id);
                }}
                accessibilityLabel={`Rechazar la factura de ${name}`}
              />
            </View>
            {!r.paid && <Text style={styles.hint}>Se emite cuando el pago aparezca como confirmado.</Text>}
            {rejecting === r.id && (
              <View style={styles.form}>
                <TextField
                  label="Motivo del rechazo"
                  value={reason}
                  onChangeText={setReason}
                  maxLength={300}
                />
                <Text style={styles.hint}>El cliente verá el motivo al consultar su pedido.</Text>
                <View style={styles.actions}>
                  <Button label="Cancelar" variant="outline" onPress={() => setRejecting(null)} />
                  <Button
                    label="Rechazar solicitud"
                    loading={vm.busy}
                    onPress={() => void vm.reject(r, reason).then((ok) => ok && setRejecting(null))}
                  />
                </View>
              </View>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: { gap: spacing.xs },
  name: { ...typography.subheading, color: colors.text, flexShrink: 1 },
  hint: { ...typography.caption, color: colors.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  form: { gap: spacing.sm, marginTop: spacing.sm },
});

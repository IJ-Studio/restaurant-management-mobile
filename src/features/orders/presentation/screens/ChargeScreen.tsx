import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { Chip } from '../../../../shared/presentation/components/Chip';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { TextField } from '../../../../shared/presentation/components/TextField';
import { colors, radius, sizes, spacing, typography } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import { TIP_PERCENTAGES, type ChargeReceipt } from '../../domain/entities/Payment';
import { useCharge } from '../viewmodels/useCharge';

export type ChargeParams = { orderId: string; place: string };

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={strong ? styles.rowLabelStrong : styles.rowLabel}>{label}</Text>
      <Text style={strong ? styles.rowValueStrong : styles.rowValue}>{value}</Text>
    </View>
  );
}

function Receipt({ receipt, place, onDone }: { receipt: ChargeReceipt; place: string; onDone: () => void }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.receipt}>
      <View style={styles.check} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="checkmark" size={44} color={colors.textOnBrand} />
      </View>
      <Text style={styles.receiptTitle} accessibilityRole="header">
        Cobrado {formatCurrency(receipt.charged)}
      </Text>
      <Text style={styles.receiptSubtitle}>
        {place} · {receipt.method}
      </Text>
      {receipt.change > 0 && (
        <Card elevation="raised" style={styles.changeCard}>
          <Text style={styles.changeLabel}>Cambio a entregar</Text>
          <Text style={styles.changeValue}>{formatCurrency(receipt.change)}</Text>
        </Card>
      )}
      <Card style={styles.receiptCard}>
        <Row label="Consumo" value={formatCurrency(receipt.total)} />
        <Row label="Propina" value={formatCurrency(receipt.tip)} />
        <Row label="Total cobrado" value={formatCurrency(receipt.charged)} strong />
      </Card>
      <Notice tone="success" message={receipt.message} style={styles.notice} />
      <Button label="Listo" onPress={onDone} style={styles.submit} />
    </ScrollView>
  );
}

export function ChargeScreen() {
  const { params } = useRoute<RouteProp<{ Charge: ChargeParams }, 'Charge'>>();
  const navigation = useNavigation();
  const vm = useCharge(params.orderId);

  if (vm.receipt)
    return <Receipt receipt={vm.receipt} place={params.place} onDone={() => navigation.goBack()} />;
  if (vm.isLoading) return <LoadingState message="Preparando el cobro…" />;
  if (vm.loadError || !vm.order) {
    return <ErrorState message={vm.loadError ?? 'No se pudo cargar el pedido.'} onRetry={vm.retry} />;
  }
  if (vm.methods.length === 0) {
    return <ErrorState message="No hay métodos de pago activos. Pide al administrador que los configure." />;
  }

  const { method, summary } = vm;
  const cash = method?.kind === 'cash';
  const itemCount = vm.order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card elevation="raised" style={styles.totalCard}>
          <Text style={styles.eyebrow}>{params.place}</Text>
          <Text style={styles.toPay} accessibilityLabel={`Total a cobrar ${formatCurrency(summary.toPay)}`}>
            {formatCurrency(summary.toPay)}
          </Text>
          <Text style={styles.toPayHint}>
            {itemCount} {itemCount === 1 ? 'platillo' : 'platillos'} · consumo{' '}
            {formatCurrency(vm.order.total)}
            {vm.tip > 0 ? ` + propina ${formatCurrency(vm.tip)}` : ''}
          </Text>
        </Card>

        <Text style={styles.section}>¿Cómo paga?</Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {vm.methods.map((option) => (
            <Chip
              key={option.id}
              label={option.name}
              selected={option.id === method?.id}
              onPress={() => vm.selectMethod(option.id)}
            />
          ))}
        </View>

        {method?.allowsTip !== false && (
          <>
            <Text style={styles.section}>Propina</Text>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {TIP_PERCENTAGES.map((percent) => (
                <Chip
                  key={percent}
                  label={percent === 0 ? 'Sin propina' : `${percent}%`}
                  accessibilityLabel={percent === 0 ? 'Sin propina' : `Propina ${percent}%`}
                  selected={vm.tipPercent === percent}
                  onPress={() => vm.selectTipPercent(percent)}
                />
              ))}
            </View>
            <TextField
              label="Otra propina ($)"
              accessibilityLabel="Otra propina"
              value={vm.customTip}
              onChangeText={vm.setCustomTip}
              keyboardType="decimal-pad"
              placeholder="0.00"
              style={styles.field}
            />
          </>
        )}

        {cash ? (
          <>
            <Text style={styles.section}>Efectivo recibido</Text>
            <View style={styles.chips}>
              {vm.suggestions.map((amount) => (
                <Chip
                  key={amount}
                  label={formatCurrency(amount)}
                  accessibilityRole="button"
                  accessibilityLabel={`Recibí ${formatCurrency(amount)}`}
                  selected={false}
                  onPress={() => vm.setReceivedText(amount.toFixed(2))}
                />
              ))}
            </View>
            <TextField
              label="Recibido ($)"
              accessibilityLabel="Efectivo recibido"
              value={vm.receivedText}
              onChangeText={vm.setReceivedText}
              keyboardType="decimal-pad"
              placeholder="0.00"
              style={styles.field}
            />
            {summary.change !== undefined && (
              <View style={[styles.changeBox, styles.changeOk]}>
                <Text style={styles.changeBoxLabel}>Cambio</Text>
                <Text style={styles.changeBoxValue}>{formatCurrency(summary.change)}</Text>
              </View>
            )}
            {summary.missing !== undefined && (
              <View style={[styles.changeBox, styles.changeMissing]}>
                <Text style={[styles.changeBoxLabel, styles.missingText]}>Faltan</Text>
                <Text style={[styles.changeBoxValue, styles.missingText]}>
                  {formatCurrency(summary.missing)}
                </Text>
              </View>
            )}
          </>
        ) : (
          <TextField
            label="Referencia o folio (opcional)"
            accessibilityLabel="Referencia"
            value={vm.reference}
            onChangeText={vm.setReference}
            autoCapitalize="characters"
            maxLength={100}
            style={styles.fieldTop}
          />
        )}

        {vm.chargeError && <Notice message={vm.chargeError} style={styles.notice} />}

        <Button
          label={`Cobrar ${formatCurrency(summary.toPay)}`}
          accessibilityLabel="Confirmar cobro"
          onPress={vm.submit}
          loading={vm.isCharging}
          disabled={vm.problem !== null}
          style={styles.submit}
        />
        {vm.problem && <Text style={styles.problem}>{vm.problem}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const CHECK_SIZE = 88;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  totalCard: { alignItems: 'center', paddingVertical: spacing.xl },
  eyebrow: { ...typography.overline, color: colors.brandStrong },
  toPay: { ...typography.amount, color: colors.text, marginTop: spacing.sm },
  toPayHint: { ...typography.small, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  section: {
    ...typography.overline,
    color: colors.brandStrong,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  field: { marginTop: spacing.md },
  fieldTop: { marginTop: spacing.xl },
  changeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  changeOk: { backgroundColor: colors.successSoft },
  changeMissing: { backgroundColor: colors.dangerSoft },
  changeBoxLabel: { ...typography.subheading, color: colors.success },
  changeBoxValue: { ...typography.title, color: colors.success },
  missingText: { color: colors.danger },
  notice: { marginTop: spacing.lg },
  submit: { marginTop: spacing.xl },
  problem: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  receipt: { padding: spacing.xl, alignItems: 'stretch', paddingTop: spacing.xxxl },
  check: {
    alignSelf: 'center',
    width: CHECK_SIZE,
    height: CHECK_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptTitle: { ...typography.title, color: colors.text, textAlign: 'center', marginTop: spacing.xl },
  receiptSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  changeCard: { alignItems: 'center', marginTop: spacing.xl, minHeight: sizes.control },
  changeLabel: { ...typography.overline, color: colors.success },
  changeValue: { ...typography.display, color: colors.success, marginTop: spacing.xs },
  receiptCard: { marginTop: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  rowLabel: { ...typography.body, color: colors.textSecondary },
  rowValue: { ...typography.body, color: colors.text },
  rowLabelStrong: { ...typography.bodyStrong, color: colors.text },
  rowValueStrong: { ...typography.bodyStrong, color: colors.text },
});

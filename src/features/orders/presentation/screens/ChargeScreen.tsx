import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { Chip } from '../../../../shared/presentation/components/Chip';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { HeroCard } from '../../../../shared/presentation/components/HeroCard';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { TextField } from '../../../../shared/presentation/components/TextField';
import {
  colors,
  pressScale,
  radius,
  sizes,
  spacing,
  typography,
} from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import { formatTime } from '../../../../shared/utils/formatDateTime';
import { TIP_PERCENTAGES, type ChargeReceipt } from '../../domain/entities/Payment';
import { useCharge, type SplitMode } from '../viewmodels/useCharge';

export type ChargeParams = { orderId: string; place: string };

type Vm = ReturnType<typeof useCharge>;

const MODES: { value: SplitMode; label: string }[] = [
  { value: 'full', label: 'Completa' },
  { value: 'equal', label: 'Partes iguales' },
  { value: 'items', label: 'Por platillo' },
];

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={strong ? styles.rowLabelStrong : styles.rowLabel}>{label}</Text>
      <Text style={strong ? styles.rowValueStrong : styles.rowValue}>{value}</Text>
    </View>
  );
}

function MiniStep({ symbol, label, onPress }: { symbol: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.miniStep, pressed && styles.miniStepPressed, pressed && pressScale]}
    >
      <Text style={styles.miniStepText}>{symbol}</Text>
    </Pressable>
  );
}

function Receipt({
  receipt,
  place,
  onDone,
  onNext,
}: {
  receipt: ChargeReceipt;
  place: string;
  onDone: () => void;
  onNext: () => void;
}) {
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
        {!receipt.closed && <Row label="Falta por cobrar" value={formatCurrency(receipt.remaining)} strong />}
      </Card>
      <Notice tone="success" message={receipt.message} style={styles.notice} />
      {receipt.closed ? (
        <Button label="Listo" onPress={onDone} style={styles.submit} />
      ) : (
        <>
          <Button label="Cobrar a la siguiente persona" onPress={onNext} style={styles.submit} />
          <Button label="Terminar después" variant="outline" onPress={onDone} style={styles.secondary} />
        </>
      )}
    </ScrollView>
  );
}

/** Pagos ya registrados de esta cuenta (cuenta separada). */
function PaymentsDone({ vm }: { vm: Vm }) {
  const payments = vm.order?.payments ?? [];
  if (payments.length === 0) return null;
  return (
    <Card style={styles.paidCard}>
      <Text style={styles.paidTitle}>
        Ya pagado {formatCurrency(vm.order?.paid ?? 0)} · falta {formatCurrency(vm.order?.remaining ?? 0)}
      </Text>
      {payments.map((payment) => (
        <View key={payment.id} style={styles.paidRow}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.paidText} numberOfLines={1}>
            {payment.reference ?? payment.method} · {payment.method}
            {payment.at ? ` · ${formatTime(payment.at)}` : ''}
          </Text>
          <Text style={styles.paidAmount}>{formatCurrency(payment.amount)}</Text>
        </View>
      ))}
    </Card>
  );
}

/** Cómo se divide la cuenta y, según el modo, cuántas personas o qué platillos paga esta. */
function SplitSection({ vm }: { vm: Vm }) {
  return (
    <>
      <Text style={styles.section}>¿Cómo se paga la cuenta?</Text>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {MODES.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={vm.mode === option.value}
            onPress={() => vm.selectMode(option.value)}
          />
        ))}
      </View>

      {vm.mode === 'equal' && (
        <Card style={styles.splitCard}>
          <View style={styles.splitRow}>
            <Text style={styles.splitLabel}>Dividir entre</Text>
            <MiniStep
              symbol="−"
              label="Menos personas en la cuenta"
              onPress={() => vm.setPeople(vm.people - 1)}
            />
            <Text style={styles.splitValue} accessibilityLabel={`${vm.people} personas`}>
              {vm.people}
            </Text>
            <MiniStep
              symbol="+"
              label="Más personas en la cuenta"
              onPress={() => vm.setPeople(vm.people + 1)}
            />
          </View>
          <Text style={styles.splitHint}>
            Cobrando a la persona {vm.person} de {vm.people} · {formatCurrency(vm.base)}
          </Text>
        </Card>
      )}

      {vm.mode === 'items' && (
        <Card style={styles.splitCard}>
          <Text style={styles.splitHint}>Marca lo que paga esta persona:</Text>
          {vm.order?.items.map((item) => {
            const qty = vm.picked[item.id] ?? 0;
            return (
              <View key={item.id} style={styles.pickRow}>
                <View style={styles.pickInfo}>
                  <Text style={styles.pickName}>{item.name}</Text>
                  <Text style={styles.pickPrice}>
                    {formatCurrency(item.unitPrice)} c/u · pide {item.quantity}
                  </Text>
                </View>
                <MiniStep
                  symbol="−"
                  label={`Quitar ${item.name} de esta cuenta`}
                  onPress={() => vm.pick(item.id, qty - 1, item.quantity)}
                />
                <Text style={styles.splitValue} accessibilityLabel={`${qty} de ${item.name}`}>
                  {qty}
                </Text>
                <MiniStep
                  symbol="+"
                  label={`Agregar ${item.name} a esta cuenta`}
                  onPress={() => vm.pick(item.id, qty + 1, item.quantity)}
                />
              </View>
            );
          })}
        </Card>
      )}
    </>
  );
}

function TipSection({ vm }: { vm: Vm }) {
  if (vm.method?.allowsTip === false) return null;
  return (
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
  );
}

function CashSection({ vm }: { vm: Vm }) {
  const { summary } = vm;
  return (
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
          <Text style={[styles.changeBoxValue, styles.missingText]}>{formatCurrency(summary.missing)}</Text>
        </View>
      )}
    </>
  );
}

export function ChargeScreen() {
  const { params } = useRoute<RouteProp<{ Charge: ChargeParams }, 'Charge'>>();
  const navigation = useNavigation();
  const vm = useCharge(params.orderId);

  if (vm.receipt) {
    return (
      <Receipt
        receipt={vm.receipt}
        place={params.place}
        onDone={() => navigation.goBack()}
        onNext={vm.nextPerson}
      />
    );
  }
  if (vm.isLoading) return <LoadingState message="Preparando el cobro…" />;
  if (vm.loadError || !vm.order) {
    return <ErrorState message={vm.loadError ?? 'No se pudo cargar el pedido.'} onRetry={vm.retry} />;
  }
  if (vm.methods.length === 0) {
    return <ErrorState message="No hay métodos de pago activos. Pide al administrador que los configure." />;
  }

  const { summary } = vm;
  const itemCount = vm.order.items.reduce((sum, item) => sum + item.quantity, 0);
  const hint =
    vm.mode === 'full'
      ? `${itemCount} ${itemCount === 1 ? 'platillo' : 'platillos'} · consumo ${formatCurrency(vm.base)}`
      : `${vm.label ?? 'Elige qué paga'} · consumo ${formatCurrency(vm.base)}`;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <HeroCard align="center" eyebrow={params.place}>
          <Text style={styles.toPay} accessibilityLabel={`Total a cobrar ${formatCurrency(summary.toPay)}`}>
            {formatCurrency(summary.toPay)}
          </Text>
          <Text style={styles.toPayHint}>
            {hint}
            {vm.tip > 0 ? ` + propina ${formatCurrency(vm.tip)}` : ''}
          </Text>
        </HeroCard>

        <PaymentsDone vm={vm} />
        <SplitSection vm={vm} />

        <Text style={styles.section}>¿Cómo paga?</Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {vm.methods.map((option) => (
            <Chip
              key={option.id}
              label={option.name}
              selected={option.id === vm.method?.id}
              onPress={() => vm.selectMethod(option.id)}
            />
          ))}
        </View>

        <TipSection vm={vm} />

        {vm.method?.kind === 'cash' ? (
          <CashSection vm={vm} />
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
const MINI_STEP = 36;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  toPay: { ...typography.amount, color: colors.textOnBrand, marginTop: spacing.sm },
  toPayHint: {
    ...typography.small,
    color: colors.textOnBrandMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  section: {
    ...typography.overline,
    color: colors.brandStrong,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  field: { marginTop: spacing.md },
  fieldTop: { marginTop: spacing.xl },
  paidCard: { marginTop: spacing.lg, gap: spacing.sm },
  paidTitle: { ...typography.bodyStrong, color: colors.text },
  paidRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  paidText: { ...typography.small, color: colors.textSecondary, flex: 1 },
  paidAmount: { ...typography.bodyStrong, color: colors.success },
  splitCard: { marginTop: spacing.md, gap: spacing.sm },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  splitLabel: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  splitValue: { ...typography.heading, color: colors.text, minWidth: spacing.xl, textAlign: 'center' },
  splitHint: { ...typography.small, color: colors.textSecondary },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  pickInfo: { flex: 1 },
  pickName: { ...typography.bodyStrong, color: colors.text },
  pickPrice: { ...typography.caption, color: colors.textSecondary },
  // 36 px de botón + 4 px de hitSlop alrededor no bastan: se completa el área táctil con margen.
  miniStep: {
    width: MINI_STEP,
    height: MINI_STEP,
    margin: (sizes.touchTarget - MINI_STEP) / 2,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStepPressed: { backgroundColor: colors.brandSoft },
  miniStepText: { ...typography.subheading, color: colors.brandStrong },
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
  secondary: { marginTop: spacing.md },
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

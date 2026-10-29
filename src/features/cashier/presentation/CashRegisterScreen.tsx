import Ionicons from '@expo/vector-icons/Ionicons';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '../../../shared/presentation/components/Button';
import { Card } from '../../../shared/presentation/components/Card';
import { ErrorState } from '../../../shared/presentation/components/ErrorState';
import { HeroCard } from '../../../shared/presentation/components/HeroCard';
import { LoadingState } from '../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../shared/presentation/components/Notice';
import { StatCard } from '../../../shared/presentation/components/StatCard';
import { TextField } from '../../../shared/presentation/components/TextField';
import { colors, radius, spacing, typography } from '../../../shared/presentation/theme';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { formatTime } from '../../../shared/utils/formatDateTime';
import { differenceLabel } from '../domain/CashRegister';
import { useCashRegister } from './useCashRegister';

/** Corte de caja: abrir turno con fondo, ver lo cobrado y cerrar contando el efectivo. */
export function CashRegisterScreen() {
  const vm = useCashRegister();

  if (vm.isLoading) return <LoadingState message="Consultando tu caja…" />;
  if (vm.loadError) return <ErrorState message={vm.loadError} onRetry={vm.refresh} />;

  if (vm.closed) {
    const { session } = vm.closed;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <HeroCard align="center" eyebrow="Corte de caja" title={formatCurrency(session.totalSales)}>
          <Text style={styles.heroHint}>
            {session.payments} cobros · propinas {formatCurrency(session.tips)}
          </Text>
        </HeroCard>
        <Notice
          tone={session.difference === 0 ? 'success' : 'warning'}
          message={vm.closed.message}
          style={styles.notice}
        />
        <Card style={styles.card}>
          <Row label="Fondo inicial" value={formatCurrency(session.openingFloat)} />
          <Row label="Efectivo esperado" value={formatCurrency(session.expectedCash)} />
          <Row label="Efectivo contado" value={formatCurrency(session.countedCash ?? 0)} />
          <Row label="Diferencia" value={differenceLabel(session.difference ?? 0)} strong />
        </Card>
        <Button label="Listo" onPress={vm.dismissClosed} style={styles.submit} />
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={vm.isRefreshing}
            tintColor={colors.brand}
            onRefresh={async () => {
              await vm.refresh();
            }}
          />
        }
      >
        {vm.session ? <OpenSession vm={vm} /> : <ClosedRegister vm={vm} />}
        {vm.errorMessage && <Notice message={vm.errorMessage} style={styles.notice} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type Vm = ReturnType<typeof useCashRegister>;

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={strong ? styles.rowStrong : styles.rowLabel}>{label}</Text>
      <Text style={strong ? styles.rowStrong : styles.rowValue}>{value}</Text>
    </View>
  );
}

function ClosedRegister({ vm }: { vm: Vm }) {
  return (
    <>
      <Card elevation="raised" style={styles.closedCard}>
        <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="lock-closed-outline" size={30} color={colors.brandStrong} />
        </View>
        <Text style={styles.closedTitle} accessibilityRole="header">
          Tu caja está cerrada
        </Text>
        <Text style={styles.closedText}>
          Ábrela al empezar tu turno con el efectivo que tienes para dar cambio.
        </Text>
      </Card>
      <TextField
        label="Fondo inicial ($)"
        accessibilityLabel="Fondo inicial"
        value={vm.floatText}
        onChangeText={vm.setFloatText}
        keyboardType="decimal-pad"
        placeholder="0.00"
        style={styles.field}
      />
      <Button label="Abrir caja" onPress={vm.openRegister} loading={vm.isOpening} style={styles.submit} />
    </>
  );
}

function OpenSession({ vm }: { vm: Vm }) {
  const session = vm.session!;
  return (
    <>
      <HeroCard
        eyebrow={`Caja abierta desde las ${formatTime(session.openedAt)}`}
        title={formatCurrency(session.totalSales)}
      >
        <Text style={styles.heroHint}>
          {session.payments} cobros en tu turno · propinas {formatCurrency(session.tips)}
        </Text>
      </HeroCard>

      <View style={styles.stats}>
        <StatCard
          label="Efectivo"
          value={formatCurrency(session.cashSales)}
          icon="cash-outline"
          style={styles.stat}
        />
        <StatCard
          label="Tarjeta"
          value={formatCurrency(session.cardSales)}
          icon="card-outline"
          style={styles.stat}
        />
        <StatCard
          label="Digital"
          value={formatCurrency(session.digitalSales)}
          icon="phone-portrait-outline"
          style={styles.stat}
        />
        <StatCard
          label="Debe haber en caja"
          value={formatCurrency(session.expectedCash)}
          hint={`fondo ${formatCurrency(session.openingFloat)}`}
          icon="wallet-outline"
          tone="brand"
          style={styles.stat}
        />
      </View>

      <Text style={styles.section}>Cerrar caja</Text>
      <Card style={styles.card}>
        <TextField
          label="Efectivo contado ($)"
          accessibilityLabel="Efectivo contado"
          value={vm.countedText}
          onChangeText={vm.setCountedText}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        {vm.difference !== undefined && (
          <View
            style={[styles.diff, vm.difference === 0 ? styles.diffOk : styles.diffWarn]}
            accessible
            accessibilityLabel={`Diferencia: ${differenceLabel(vm.difference)}`}
          >
            <Text style={[styles.diffText, vm.difference === 0 ? styles.diffOkText : styles.diffWarnText]}>
              {differenceLabel(vm.difference)}
            </Text>
          </View>
        )}
        <TextField
          label="Notas (opcional)"
          accessibilityLabel="Notas del corte"
          value={vm.notes}
          onChangeText={vm.setNotes}
          multiline
          maxLength={500}
          style={styles.field}
        />
      </Card>
      <Button
        label="Cerrar caja"
        variant="secondary"
        onPress={vm.closeRegister}
        loading={vm.isClosing}
        disabled={vm.difference === undefined}
        style={styles.submit}
      />
    </>
  );
}

const ICON = 64;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  heroHint: { ...typography.small, color: colors.textOnBrandMuted, marginTop: spacing.xs },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  stat: { flexGrow: 1, flexBasis: '45%' },
  section: {
    ...typography.overline,
    color: colors.brandStrong,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  card: { paddingTop: spacing.md },
  field: { marginTop: spacing.lg },
  diff: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  diffOk: { backgroundColor: colors.successSoft },
  diffWarn: { backgroundColor: colors.warningSoft },
  diffText: { ...typography.subheading },
  diffOkText: { color: colors.success },
  diffWarnText: { color: colors.warning },
  notice: { marginTop: spacing.lg },
  submit: { marginTop: spacing.xl },
  closedCard: { alignItems: 'center', paddingVertical: spacing.xl },
  icon: {
    width: ICON,
    height: ICON,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedTitle: { ...typography.title, color: colors.text, marginTop: spacing.lg },
  closedText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  rowLabel: { ...typography.body, color: colors.textSecondary },
  rowValue: { ...typography.body, color: colors.text },
  rowStrong: { ...typography.bodyStrong, color: colors.text },
});

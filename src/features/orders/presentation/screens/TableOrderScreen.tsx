import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { Chip } from '../../../../shared/presentation/components/Chip';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { ScreenState } from '../../../../shared/presentation/components/ScreenState';
import { colors, radius, sizes, spacing, typography } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import type { OrderLine } from '../../domain/entities/TableOrder';
import { useTableOrder } from '../viewmodels/useTableOrder';

function StepButton({ symbol, label, onPress }: { symbol: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.step, pressed && styles.stepPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.stepText}>{symbol}</Text>
    </Pressable>
  );
}

function QuantityStepper({ line, onChange }: { line: OrderLine; onChange: (quantity: number) => void }) {
  return (
    <View style={styles.stepper}>
      <StepButton
        symbol="−"
        label={`Quitar uno de ${line.name}`}
        onPress={() => onChange(line.quantity - 1)}
      />
      <Text style={styles.quantity}>{line.quantity}</Text>
      <StepButton
        symbol="+"
        label={`Agregar uno de ${line.name}`}
        onPress={() => onChange(line.quantity + 1)}
      />
    </View>
  );
}

export function TableOrderScreen() {
  const vm = useTableOrder();

  if (vm.sentMessage && vm.order.lines.length === 0) {
    return (
      <ScreenState
        kind="empty"
        message={`${vm.sentMessage} El pedido de la mesa quedó vacío para el siguiente.`}
      />
    );
  }
  if (vm.order.lines.length === 0) {
    return <ScreenState kind="empty" message="Agrega platillos desde el menú." />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Mesa</Text>
      {vm.tablesError ? (
        <Text style={styles.tablesError}>{vm.tablesError}</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tablesBar}
          contentContainerStyle={styles.tables}
          accessibilityRole="radiogroup"
        >
          {vm.tables.map((table) => (
            <Chip
              key={table.id}
              label={table.number}
              accessibilityLabel={`Mesa ${table.number}`}
              selected={vm.order.tableNumber === table.number}
              onPress={() => vm.selectTable(table.number)}
            />
          ))}
        </ScrollView>
      )}

      <FlatList
        data={vm.order.lines}
        keyExtractor={(line) => String(line.dishId)}
        contentContainerStyle={styles.lines}
        renderItem={({ item }) => (
          <View style={styles.line}>
            <View style={styles.lineInfo}>
              <Text style={styles.lineName}>{item.name}</Text>
              <Text style={styles.linePrice}>{formatCurrency(item.unitPrice * item.quantity)}</Text>
            </View>
            <QuantityStepper line={item} onChange={(quantity) => vm.setQuantity(item.dishId, quantity)} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <Card elevation="raised" style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{vm.count} platillos · Total estimado</Text>
          <Text style={styles.total}>{formatCurrency(vm.total)}</Text>
        </View>
        {vm.sendError && <Notice message={vm.sendError} style={styles.notice} />}
        <Button
          label="Enviar a cocina"
          onPress={vm.sendToKitchen}
          loading={vm.isSending}
          style={styles.send}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionTitle: {
    ...typography.overline,
    color: colors.brandStrong,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  tablesError: { ...typography.small, color: colors.danger, margin: spacing.lg },
  tablesBar: { flexGrow: 0 },
  tables: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  lines: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  lineInfo: { flex: 1, marginRight: spacing.md },
  lineName: { ...typography.subheading, color: colors.text },
  linePrice: { ...typography.bodyStrong, color: colors.brandStrong, marginTop: spacing.xxs },
  separator: { height: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  step: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPressed: { backgroundColor: colors.brandSoft },
  stepText: { ...typography.heading, color: colors.brandStrong },
  quantity: { ...typography.heading, color: colors.text, minWidth: spacing.xxl, textAlign: 'center' },
  footer: { margin: spacing.lg, marginTop: 0 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  totalLabel: { ...typography.small, color: colors.textSecondary, flexShrink: 1 },
  total: { ...typography.title, color: colors.text },
  notice: { marginTop: spacing.md },
  send: { marginTop: spacing.lg },
});
